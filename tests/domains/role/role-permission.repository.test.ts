import "reflect-metadata";
import { RolePermissionRepository } from "../../../src/domains/role/repositories/role-permission.repository";
import { MongoDBConnectionManager } from "../../../src/infrastructure/database/mongodbmanager.service";
import { getRolePermissionModel } from "../../../src/domains/role/models/role-permission.model";

jest.mock("../../../src/domains/role/models/role-permission.model");

describe("RolePermissionRepository", () => {
  let repository: RolePermissionRepository;
  let mongoManager: jest.Mocked<MongoDBConnectionManager>;
  let mockConnection: any;
  let mockModel: any;

  beforeEach(() => {
    mockModel = {
      create: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      findOneAndDelete: jest.fn(),
      bulkWrite: jest.fn(),
      deleteMany: jest.fn(),
      countDocuments: jest.fn(),
    };

    mockConnection = {};

    mongoManager = {
      getConnection: jest.fn().mockReturnValue(mockConnection),
    } as any;

    (getRolePermissionModel as jest.Mock).mockReturnValue(mockModel);

    repository = new RolePermissionRepository(mongoManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("findByTenantRoleAndPermission", () => {
    it("should find a specific role permission", async () => {
      const rolePermission = {
        tenantId: "t1",
        roleId: "r1",
        permissionId: "p1",
        effect: "ALLOW",
      };

      mockModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(rolePermission),
      });

      const result = await repository.findByTenantRoleAndPermission("t1", "r1", "p1");

      expect(mockModel.findOne).toHaveBeenCalledWith({
        tenantId: "t1",
        roleId: "r1",
        permissionId: "p1",
      });
      expect(result).toEqual(rolePermission);
    });

    it("should return null if not found", async () => {
      mockModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.findByTenantRoleAndPermission("t1", "r1", "unknown");

      expect(result).toBeNull();
    });
  });

  describe("removePermission", () => {
    it("should remove a permission from a role", async () => {
      const deletedPermission = {
        tenantId: "t1",
        roleId: "r1",
        permissionId: "p1",
        effect: "ALLOW",
      };

      mockModel.findOneAndDelete.mockReturnValue({
        lean: jest.fn().mockResolvedValue(deletedPermission),
      });

      const result = await repository.removePermission("t1", "r1", "p1");

      expect(mockModel.findOneAndDelete).toHaveBeenCalledWith({
        tenantId: "t1",
        roleId: "r1",
        permissionId: "p1",
      });
      expect(result).toEqual(deletedPermission);
    });

    it("should return null if permission not found", async () => {
      mockModel.findOneAndDelete.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.removePermission("t1", "r1", "unknown");

      expect(result).toBeNull();
    });

    describe("attachPermissions", () => {
      it("should attach new permissions to a role", async () => {
        mockModel.findOne.mockResolvedValue(null);
        mockModel.create.mockResolvedValue({});

        const result = await repository.attachPermissions("t1", "r1", ["p1", "p2"]);

        expect(mockModel.findOne).toHaveBeenCalledTimes(2);
        expect(mockModel.create).toHaveBeenCalledTimes(2);
        expect(mockModel.create).toHaveBeenCalledWith({
        tenantId: "t1",
        roleId: "r1",
        permissionId: "p1",
        effect: "ALLOW",
        });
        expect(mockModel.create).toHaveBeenCalledWith({
        tenantId: "t1",
        roleId: "r1",
        permissionId: "p2",
        effect: "ALLOW",
        });
        expect(result).toEqual([
        { permissionId: "p1", isNew: true },
        { permissionId: "p2", isNew: true },
        ]);
      });

      it("should handle existing permissions (idempotent)", async () => {
        const existingPermission = {
        tenantId: "t1",
        roleId: "r1",
        permissionId: "p1",
        effect: "ALLOW",
        };

        mockModel.findOne.mockResolvedValue(existingPermission);

        const result = await repository.attachPermissions("t1", "r1", ["p1"]);

        expect(mockModel.findOne).toHaveBeenCalledWith({
        tenantId: "t1",
        roleId: "r1",
        permissionId: "p1",
        });
        expect(mockModel.create).not.toHaveBeenCalled();
        expect(result).toEqual([{ permissionId: "p1", isNew: false }]);
      });

      it("should handle mix of new and existing permissions", async () => {
        mockModel.findOne
        .mockResolvedValueOnce({ permissionId: "p1" })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

        mockModel.create.mockResolvedValue({});

        const result = await repository.attachPermissions("t1", "r1", ["p1", "p2", "p3"]);

        expect(mockModel.findOne).toHaveBeenCalledTimes(3);
        expect(mockModel.create).toHaveBeenCalledTimes(2);
        expect(result).toEqual([
        { permissionId: "p1", isNew: false },
        { permissionId: "p2", isNew: true },
        { permissionId: "p3", isNew: true },
        ]);
      });

      it("should return empty array for empty permission list", async () => {
        const result = await repository.attachPermissions("t1", "r1", []);

        expect(mockModel.findOne).not.toHaveBeenCalled();
        expect(mockModel.create).not.toHaveBeenCalled();
        expect(result).toEqual([]);
      });
      });
  });
});
