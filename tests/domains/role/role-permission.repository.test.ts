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
  });
});
