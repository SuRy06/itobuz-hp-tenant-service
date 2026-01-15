import "reflect-metadata";
import { PermissionRepository } from "../../../src/domains/permission/repositories/permission.repository";
import { MongoDBConnectionManager } from "../../../src/infrastructure/database/mongodbmanager.service";
import { getPermissionsModel } from "../../../src/domains/permission/models/permissions.model";

jest.mock("../../../src/domains/permission/models/permissions.model");

describe("PermissionRepository", () => {
  let repository: PermissionRepository;
  let mongoManager: jest.Mocked<MongoDBConnectionManager>;
  let mockConnection: any;
  let mockModel: any;

  beforeEach(() => {
    mockModel = {
      find: jest.fn(),
      create: jest.fn(),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };

    mockConnection = {};

    mongoManager = {
      getConnection: jest.fn().mockReturnValue(mockConnection),
    } as any;

    (getPermissionsModel as jest.Mock).mockReturnValue(mockModel);

    repository = new PermissionRepository(mongoManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("listPermission", () => {
    it("should list permissions with filters", async () => {
      const mockResults = [{ permissionId: "1" }];

      mockModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockResults),
          }),
        }),
      });

      const result = await repository.listPermission({
        status: "ACTIVE",
        query: "user",
        limit: 10,
        cursor: "5",
      });

      expect(getPermissionsModel).toHaveBeenCalledWith(mockConnection);
      expect(mockModel.find).toHaveBeenCalledWith({
        status: "ACTIVE",
        $or: [{ key: { $regex: "user", $options: "i" } }, { description: { $regex: "user", $options: "i" } }],
        _id: { $gt: "5" },
      });

      expect(result).toEqual(mockResults);
    });

    it("should list permissions without optional filters", async () => {
      mockModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      await repository.listPermission({ limit: 5 });

      expect(mockModel.find).toHaveBeenCalledWith({});
    });
  });

  describe("create", () => {
    it("should create a permission", async () => {
      const mockPermission = {
        permissionId: "1",
        key: "USER.CREATE",
      };

      mockModel.create.mockResolvedValue(mockPermission);

      const result = await repository.create({
        permissionId: "1",
        key: "USER.CREATE",
        description: "Create user",
        status: "ACTIVE",
      });

      expect(mockModel.create).toHaveBeenCalledWith({
        permissionId: "1",
        key: "USER.CREATE",
        description: "Create user",
        status: "ACTIVE",
      });

      expect(result).toBe(mockPermission);
    });
  });

  describe("findByKey", () => {
    it("should find permission by key", async () => {
      const mockPermission = { key: "USER.READ" };

      mockModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockPermission),
      });

      const result = await repository.findByKey("USER.READ");

      expect(mockModel.findOne).toHaveBeenCalledWith({ key: "USER.READ" });
      expect(result).toEqual(mockPermission);
    });

    it("should return null if permission not found", async () => {
      mockModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.findByKey("UNKNOWN");

      expect(result).toBeNull();
    });
  });

  describe("updateStatus", () => {
    it("should update permission status", async () => {
      const updatedPermission = {
        permissionId: "1",
        status: "DEPRECATED",
      };

      mockModel.findOneAndUpdate.mockResolvedValue(updatedPermission);

      const result = await repository.updateStatus("1", "DEPRECATED");

      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { permissionId: "1" },
        { status: "DEPRECATED" },
        { new: true }
      );

      expect(result).toBe(updatedPermission);
    });
  });
});
