import "reflect-metadata";
import { RoleRepository } from "../../../src/domains/role/repositories/role.repository";
import { MongoDBConnectionManager } from "../../../src/infrastructure/database/mongodbmanager.service";
import { getRolesModel } from "../../../src/domains/role/models/roles.model";

jest.mock("../../../src/domains/role/models/roles.model.ts");

describe("RoleRepository", () => {
  let repository: RoleRepository;
  let mongoManager: jest.Mocked<MongoDBConnectionManager>;
  let mockConnection: any;
  let mockModel: any;

  beforeEach(() => {
    mockModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      findOneAndUpdate: jest.fn(),
      find: jest.fn(),
    };

    mockConnection = {};

    mongoManager = {
      getConnection: jest.fn().mockReturnValue(mockConnection),
    } as any;

    (getRolesModel as jest.Mock).mockReturnValue(mockModel);

    repository = new RoleRepository(mongoManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findByName", () => {
    it("should find role by tenantId and name", async () => {
      const role = {
        roleId: "r1",
        tenantId: "t1",
        name: "Admin",
      };

      mockModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(role),
      });

      const result = await repository.findByName("t1", "Admin");

      expect(getRolesModel).toHaveBeenCalledWith(mockConnection);
      expect(mockModel.findOne).toHaveBeenCalledWith({
        tenantId: "t1",
        name: "Admin",
      });
      expect(result).toEqual(role);
    });

    it("should return null if role not found", async () => {
      mockModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.findByName("t1", "Unknown");

      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("should create a role and return mapped response", async () => {
      const createdDoc = {
        roleId: "r1",
        tenantId: "t1",
        name: "Admin",
        status: "ACTIVE",
        roleVersion: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockModel.create.mockResolvedValue(createdDoc);

      const result = await repository.create({
        roleId: "r1",
        tenantId: "t1",
        name: "Admin",
        roleVersion: 1,
      });

      expect(getRolesModel).toHaveBeenCalledWith(mockConnection);
      expect(mockModel.create).toHaveBeenCalledWith({
        roleId: "r1",
        tenantId: "t1",
        name: "Admin",
        status: "ACTIVE",
        roleVersion: 1,
      });

      expect(result).toEqual({
        roleId: "r1",
        tenantId: "t1",
        name: "Admin",
        status: "ACTIVE",
        roleVersion: 1,
        createdAt: createdDoc.createdAt,
        updatedAt: createdDoc.updatedAt,
      });
    });
  });
  describe("updatePermissionsAtomic", () => {
    it("should atomically add and remove permissions and increment roleVersion", async () => {
      const updatedRole = {
        roleId: "r1",
        tenantId: "t1",
        permissions: ["READ", "WRITE"],
        roleVersion: 2,
      };

      mockModel.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue(updatedRole),
      });

      const result = await repository.updatePermissionsAtomic("t1", "r1", ["WRITE"], ["DELETE"]);

      expect(getRolesModel).toHaveBeenCalledWith(mockConnection);

      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        {
          roleId: "r1",
          tenantId: "t1",
        },
        {
          $addToSet: {
            permissions: { $each: ["WRITE"] },
          },
          $pullAll: {
            permissions: ["DELETE"],
          },
          $inc: {
            roleVersion: 1,
          },
        },
        {
          new: true,
        }
      );

      expect(result).toEqual(updatedRole);
    });

    it("should only increment version when add and remove are empty", async () => {
      mockModel.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await repository.updatePermissionsAtomic("t1", "r1", [], []);

      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        {
          roleId: "r1",
          tenantId: "t1",
        },
        {
          $inc: {
            roleVersion: 1,
          },
        },
        {
          new: true,
        }
      );
    });
  });
  describe("listByTenant", () => {
    it("should list roles by tenant without cursor", async () => {
      const roles = [
        { roleId: "r1", name: "ADMIN" },
        { roleId: "r2", name: "USER" },
      ];

      mockModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(roles),
            }),
          }),
        }),
      });

      const result = await repository.listByTenant("tenant-1", 10, undefined);

      expect(getRolesModel).toHaveBeenCalledWith(mockConnection);

      expect(mockModel.find).toHaveBeenCalledWith({
        tenantId: "tenant-1",
      });

      expect(result).toEqual({ roles });
    });

    it("should list roles by tenant using cursor pagination", async () => {
      const decodedCursor = {
        createdAt: new Date("2024-01-01T00:00:00.000Z").toISOString(),
        _id: "r1",
      };

      const cursor = Buffer.from(JSON.stringify(decodedCursor)).toString("base64");

      mockModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue([]),
            }),
          }),
        }),
      });

      await repository.listByTenant("tenant-1", 5, cursor);

      expect(mockModel.find).toHaveBeenCalledWith({
        tenantId: "tenant-1",
        $or: [
          { createdAt: { $gt: new Date(decodedCursor.createdAt) } },
          {
            createdAt: new Date(decodedCursor.createdAt),
            _id: { $gt: decodedCursor._id },
          },
        ],
      });
    });
  });
});
