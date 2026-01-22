import "reflect-metadata";
import { TenantMembershipService } from "../../../src/domains/membership/services/tenant-membership.service";
import { TenantMembershipRepository } from "../../../src/domains/membership/respositories/tenant-membership.repository";
import { RoleRepository } from "../../../src/domains/role/repositories/role.repository";
import { MembershipOverrideRepository } from "../../../src/domains/membership/respositories/membership-overrides.repository";
import { PermissionRepository } from "../../../src/domains/permission/repositories/permission.repository";

describe("TenantMembershipService", () => {
  let service: TenantMembershipService;
  let membershipRepository: jest.Mocked<TenantMembershipRepository>;
  let roleRepository: jest.Mocked<RoleRepository>;
  let membershipOverrideRepository: jest.Mocked<MembershipOverrideRepository>;
  let permissionRepository: jest.Mocked<PermissionRepository>;

  beforeEach(() => {
    membershipRepository = {
      updateRolesAtomic: jest.fn(),
      findByTenantAndUser: jest.fn(),
      increaseVersion: jest.fn(),
      updateStatus: jest.fn(),
      assignPermissions: jest.fn(),
      removePermission: jest.fn(),
    } as any;

    roleRepository = {
      findByTenantAndRoleIds: jest.fn(),
    } as any;

    membershipOverrideRepository = {
      upsertOverride: jest.fn(),
      deleteOverride: jest.fn(),
    } as any;

    permissionRepository = {
      findByPermissionId: jest.fn(),
    } as any;

    service = new TenantMembershipService(
      membershipRepository,
      roleRepository,
      membershipOverrideRepository,
      permissionRepository
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("updateMembershipRoles", () => {
    it("should throw 400 if nothing to update", async () => {
      await expect(
        service.updateMembershipRoles("t1", "u1", [], [])
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Nothing to update",
      });
    });

    it("should throw 400 if any role ID is invalid for tenant", async () => {
      roleRepository.findByTenantAndRoleIds.mockResolvedValue([
        { roleId: "r1" },
      ] as any); // missing one role

      await expect(
        service.updateMembershipRoles("t1", "u1", ["r1"], ["r2"])
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Invalid role ID(s) for tenant",
      });

      expect(roleRepository.findByTenantAndRoleIds).toHaveBeenCalledWith("t1", [
        "r1",
        "r2",
      ]);
    });

    it("should throw 404 if tenant membership not found", async () => {
      roleRepository.findByTenantAndRoleIds.mockResolvedValue([
        { roleId: "r1" },
        { roleId: "r2" },
      ] as any);

      membershipRepository.updateRolesAtomic.mockResolvedValue(null);

      await expect(
        service.updateMembershipRoles("t1", "u1", ["r1"], ["r2"])
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Tenant membership not found",
      });
    });

    it("should update membership roles successfully", async () => {
      roleRepository.findByTenantAndRoleIds.mockResolvedValue([
        { roleId: "r1" },
        { roleId: "r2" },
      ] as any);

      const updatedMembership = {
        tenantId: "t1",
        userId: "u1",
        roles: ["r1"],
        membershipVersion: 2,
        updatedAt: new Date(),
      };

      membershipRepository.updateRolesAtomic.mockResolvedValue(
        updatedMembership as any
      );

      const result = await service.updateMembershipRoles(
        "t1",
        "u1",
        ["r1"],
        ["r2"]
      );

      expect(membershipRepository.updateRolesAtomic).toHaveBeenCalledWith({
        tenantId: "t1",
        userId: "u1",
        add: ["r1"],
        remove: ["r2"],
      });

      expect(result).toEqual({
        tenantId: "t1",
        userId: "u1",
        roleIds: ["r1"],
        membershipVersion: 2,
        updatedAt: updatedMembership.updatedAt,
      });
    });
  });
  describe("setOverride", () => {
    it("should throw 400 if permission is invalid", async () => {
      permissionRepository.findByPermissionId.mockResolvedValue(null);

      await expect(
        service.setOverride("t1", "u1", "p1", "ALLOW", "test")
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Invalid permissionId",
      });
    });

    it("should throw 404 if membership is not found", async () => {
      permissionRepository.findByPermissionId.mockResolvedValue({
        id: "p1",
      } as any);
      membershipRepository.findByTenantAndUser.mockResolvedValue(null);

      await expect(
        service.setOverride("t1", "u1", "p1", "DENY", "reason")
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Membership not found",
      });
    });

    it("should create override and bump membership version", async () => {
      permissionRepository.findByPermissionId.mockResolvedValue({
        id: "p1",
      } as any);

      membershipRepository.findByTenantAndUser.mockResolvedValue({
        tenantId: "t1",
        userId: "u1",
      } as any);

      const override = {
        effect: "ALLOW",
        createdAt: new Date(),
      };

      membershipOverrideRepository.upsertOverride.mockResolvedValue(
        override as any
      );

      membershipRepository.increaseVersion.mockResolvedValue({
        membershipVersion: 2,
      } as any);

      const result = await service.setOverride(
        "t1",
        "u1",
        "p1",
        "ALLOW",
        "reason"
      );

      expect(membershipOverrideRepository.upsertOverride).toHaveBeenCalledWith(
        "t1",
        "u1",
        "p1",
        "ALLOW",
        "reason"
      );

      expect(result).toEqual({
        tenantId: "t1",
        userId: "u1",
        permissionId: "p1",
        effect: "ALLOW",
        membershipVersion: 2,
        createdAt: override.createdAt,
      });
    });
  });

  describe("removeOverride", () => {
    it("should throw 404 if override not found", async () => {
      membershipOverrideRepository.deleteOverride.mockResolvedValue(null);

      await expect(
        service.removeOverride("t1", "u1", "p1")
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Override not found",
      });
    });

    it("should remove override and bump membership version", async () => {
      membershipOverrideRepository.deleteOverride.mockResolvedValue({} as any);

      membershipRepository.increaseVersion.mockResolvedValue({
        membershipVersion: 3,
      } as any);

      const result = await service.removeOverride("t1", "u1", "p1");

      expect(membershipOverrideRepository.deleteOverride).toHaveBeenCalledWith(
        "t1",
        "u1",
        "p1"
      );

      expect(result).toEqual({
        tenantId: "t1",
        userId: "u1",
        permissionId: "p1",
        deleted: true,
        membershipVersion: 3,
      });
    });
  });
  describe("suspendMembership", () => {
    it("should throw 404 if membership not found", async () => {
      membershipRepository.updateStatus.mockResolvedValue(null);

      await expect(service.suspendMembership("t1", "u1")).rejects.toMatchObject(
        {
          statusCode: 404,
          message: "Membership not found",
        }
      );

      expect(membershipRepository.updateStatus).toHaveBeenCalledWith(
        "t1",
        "u1",
        "SUSPENDED"
      );
    });

    it("should suspend membership successfully", async () => {
      const membership = {
        tenantId: "t1",
        userId: "u1",
        status: "SUSPENDED",
        membershipVersion: 2,
      };

      membershipRepository.updateStatus.mockResolvedValue(membership as any);

      const result = await service.suspendMembership("t1", "u1");

      expect(membershipRepository.updateStatus).toHaveBeenCalledWith(
        "t1",
        "u1",
        "SUSPENDED"
      );

      expect(result).toEqual({
        tenantId: "t1",
        userId: "u1",
        status: "SUSPENDED",
        membershipVersion: 2,
      });
    });
  });

  describe("unsuspendMembership", () => {
    it("should throw 404 if membership not found", async () => {
      membershipRepository.updateStatus.mockResolvedValue(null);

      await expect(
        service.unsuspendMembership("t1", "u1")
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Membership not found",
      });

      expect(membershipRepository.updateStatus).toHaveBeenCalledWith(
        "t1",
        "u1",
        "ACTIVE"
      );
    });

    it("should unsuspend membership successfully", async () => {
      const membership = {
        tenantId: "t1",
        userId: "u1",
        status: "ACTIVE",
        membershipVersion: 3,
      };

      membershipRepository.updateStatus.mockResolvedValue(membership as any);

      const result = await service.unsuspendMembership("t1", "u1");

      expect(membershipRepository.updateStatus).toHaveBeenCalledWith(
        "t1",
        "u1",
        "ACTIVE"
      );

      expect(result).toEqual({
        tenantId: "t1",
        userId: "u1",
        status: "ACTIVE",
        membershipVersion: 3,
      });
    });
  });

  describe("assignRoleToUser", () => {
    it("should throw 404 if membership not found", async () => {
      membershipRepository.findByTenantAndUser.mockResolvedValue(null);

      await expect(
        service.assignRoleToUser("t1", "u1", "role1")
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Membership not found",
      });

      expect(membershipRepository.findByTenantAndUser).toHaveBeenCalledWith(
        "t1",
        "u1"
      );
    });

    it("should throw 400 if role does not belong to tenant", async () => {
      membershipRepository.findByTenantAndUser.mockResolvedValue({
        tenantId: "t1",
        userId: "u1",
      } as any);

      roleRepository.findByTenantAndRoleIds.mockResolvedValue([]);

      await expect(
        service.assignRoleToUser("t1", "u1", "role1")
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Invalid role ID for tenant",
      });

      expect(roleRepository.findByTenantAndRoleIds).toHaveBeenCalledWith("t1", [
        "role1",
      ]);
    });

    it("should assign role successfully", async () => {
      membershipRepository.findByTenantAndUser.mockResolvedValue({
        tenantId: "t1",
        userId: "u1",
      } as any);

      roleRepository.findByTenantAndRoleIds.mockResolvedValue([
        { roleId: "role1" },
      ] as any);

      const updatedMembership = {
        tenantId: "t1",
        userId: "u1",
        roles: ["role1"],
        membershipVersion: 5,
      };

      membershipRepository.updateRolesAtomic.mockResolvedValue(
        updatedMembership as any
      );

      const result = await service.assignRoleToUser("t1", "u1", "role1");

      expect(membershipRepository.updateRolesAtomic).toHaveBeenCalledWith({
        tenantId: "t1",
        userId: "u1",
        add: ["role1"],
        remove: [],
      });

      expect(result).toEqual({
        tenantId: "t1",
        userId: "u1",
        roleId: "role1",
        membershipVersion: 5,
      });
    });

    it("should handle idempotent role assignment", async () => {
      membershipRepository.findByTenantAndUser.mockResolvedValue({
        tenantId: "t1",
        userId: "u1",
        roles: ["role1"],
      } as any);

      roleRepository.findByTenantAndRoleIds.mockResolvedValue([
        { roleId: "role1" },
      ] as any);

      const updatedMembership = {
        tenantId: "t1",
        userId: "u1",
        roles: ["role1"],
        membershipVersion: 6,
      };

      membershipRepository.updateRolesAtomic.mockResolvedValue(
        updatedMembership as any
      );

      const result = await service.assignRoleToUser("t1", "u1", "role1");

      expect(membershipRepository.updateRolesAtomic).toHaveBeenCalledWith({
        tenantId: "t1",
        userId: "u1",
        add: ["role1"],
        remove: [],
      });

      expect(result).toEqual({
        tenantId: "t1",
        userId: "u1",
        roleId: "role1",
        membershipVersion: 6,
      });
    });
  });

  describe("assignPermissionsToUser", () => {
    it("should throw 404 if membership not found", async () => {
      membershipRepository.findByTenantAndUser.mockResolvedValue(null);

      await expect(
        service.assignPermissionsToUser("t1", "u1", ["perm1"])
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Membership not found",
      });

      expect(membershipRepository.findByTenantAndUser).toHaveBeenCalledWith(
        "t1",
        "u1"
      );
    });

    it("should throw 400 if any permission ID is invalid", async () => {
      membershipRepository.findByTenantAndUser.mockResolvedValue({
        tenantId: "t1",
        userId: "u1",
      } as any);

      permissionRepository.findByPermissionId
        .mockResolvedValueOnce({ permissionId: "perm1" } as any)
        .mockResolvedValueOnce(null);

      await expect(
        service.assignPermissionsToUser("t1", "u1", ["perm1", "perm2"])
      ).rejects.toMatchObject({
        statusCode: 400,
        message: "Invalid permission ID(s): perm2",
      });

      expect(permissionRepository.findByPermissionId).toHaveBeenCalledTimes(2);
    });

    it("should throw 404 if membership not found during assignment", async () => {
      membershipRepository.findByTenantAndUser.mockResolvedValue({
        tenantId: "t1",
        userId: "u1",
      } as any);

      permissionRepository.findByPermissionId.mockResolvedValue({
        permissionId: "perm1",
      } as any);

      membershipRepository.assignPermissions.mockResolvedValue(null);

      await expect(
        service.assignPermissionsToUser("t1", "u1", ["perm1"])
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Tenant membership not found",
      });
    });

    it("should assign permissions successfully", async () => {
      membershipRepository.findByTenantAndUser.mockResolvedValue({
        tenantId: "t1",
        userId: "u1",
      } as any);

      permissionRepository.findByPermissionId
        .mockResolvedValueOnce({ permissionId: "perm1" } as any)
        .mockResolvedValueOnce({ permissionId: "perm2" } as any);

      const updatedMembership = {
        tenantId: "t1",
        userId: "u1",
        permissions: ["perm1", "perm2"],
        membershipVersion: 5,
      };

      membershipRepository.assignPermissions.mockResolvedValue(
        updatedMembership as any
      );

      const result = await service.assignPermissionsToUser("t1", "u1", [
        "perm1",
        "perm2",
      ]);

      expect(membershipRepository.assignPermissions).toHaveBeenCalledWith(
        "t1",
        "u1",
        ["perm1", "perm2"]
      );

      expect(result).toEqual({
        tenantId: "t1",
        userId: "u1",
        permissionIds: ["perm1", "perm2"],
        membershipVersion: 5,
      });
    });

    it("should handle idempotent permission assignment", async () => {
      membershipRepository.findByTenantAndUser.mockResolvedValue({
        tenantId: "t1",
        userId: "u1",
        permissions: ["perm1"],
      } as any);

      permissionRepository.findByPermissionId.mockResolvedValue({
        permissionId: "perm1",
      } as any);

      const updatedMembership = {
        tenantId: "t1",
        userId: "u1",
        permissions: ["perm1"],
        membershipVersion: 6,
      };

      membershipRepository.assignPermissions.mockResolvedValue(
        updatedMembership as any
      );

      const result = await service.assignPermissionsToUser("t1", "u1", [
        "perm1",
      ]);

      expect(membershipRepository.assignPermissions).toHaveBeenCalledWith(
        "t1",
        "u1",
        ["perm1"]
      );

      expect(result).toEqual({
        tenantId: "t1",
        userId: "u1",
        permissionIds: ["perm1"],
        membershipVersion: 6,
      });
    });
  });

  describe("detachPermissionFromUser", () => {
    it("should throw 404 if membership not found", async () => {
      membershipRepository.findByTenantAndUser.mockResolvedValue(null);

      await expect(
        service.detachPermissionFromUser("t1", "u1", "perm1")
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Membership not found",
      });

      expect(membershipRepository.findByTenantAndUser).toHaveBeenCalledWith(
        "t1",
        "u1"
      );
    });

    it("should throw 404 if permission not in user's direct permissions", async () => {
      membershipRepository.findByTenantAndUser.mockResolvedValue({
        tenantId: "t1",
        userId: "u1",
        permissions: ["perm2", "perm3"],
      } as any);

      await expect(
        service.detachPermissionFromUser("t1", "u1", "perm1")
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Permission not found in user's direct permissions",
      });

      expect(membershipRepository.findByTenantAndUser).toHaveBeenCalledWith(
        "t1",
        "u1"
      );
    });

    it("should throw 404 if permission array is empty", async () => {
      membershipRepository.findByTenantAndUser.mockResolvedValue({
        tenantId: "t1",
        userId: "u1",
        permissions: [],
      } as any);

      await expect(
        service.detachPermissionFromUser("t1", "u1", "perm1")
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Permission not found in user's direct permissions",
      });
    });

    it("should throw 404 if membership not found during removal", async () => {
      membershipRepository.findByTenantAndUser.mockResolvedValue({
        tenantId: "t1",
        userId: "u1",
        permissions: ["perm1"],
      } as any);

      membershipRepository.removePermission.mockResolvedValue(null);

      await expect(
        service.detachPermissionFromUser("t1", "u1", "perm1")
      ).rejects.toMatchObject({
        statusCode: 404,
        message: "Tenant membership not found",
      });
    });

    it("should remove permission successfully", async () => {
      membershipRepository.findByTenantAndUser.mockResolvedValue({
        tenantId: "t1",
        userId: "u1",
        permissions: ["perm1", "perm2"],
      } as any);

      const updatedMembership = {
        tenantId: "t1",
        userId: "u1",
        permissions: ["perm2"],
        membershipVersion: 7,
      };

      membershipRepository.removePermission.mockResolvedValue(
        updatedMembership as any
      );

      const result = await service.detachPermissionFromUser(
        "t1",
        "u1",
        "perm1"
      );

      expect(membershipRepository.removePermission).toHaveBeenCalledWith(
        "t1",
        "u1",
        "perm1"
      );

      expect(result).toEqual({
        tenantId: "t1",
        userId: "u1",
        permissionId: "perm1",
        removed: true,
        membershipVersion: 7,
      });
    });

    it("should handle removing last permission", async () => {
      membershipRepository.findByTenantAndUser.mockResolvedValue({
        tenantId: "t1",
        userId: "u1",
        permissions: ["perm1"],
      } as any);

      const updatedMembership = {
        tenantId: "t1",
        userId: "u1",
        permissions: [],
        membershipVersion: 8,
      };

      membershipRepository.removePermission.mockResolvedValue(
        updatedMembership as any
      );

      const result = await service.detachPermissionFromUser(
        "t1",
        "u1",
        "perm1"
      );

      expect(membershipRepository.removePermission).toHaveBeenCalledWith(
        "t1",
        "u1",
        "perm1"
      );

      expect(result).toEqual({
        tenantId: "t1",
        userId: "u1",
        permissionId: "perm1",
        removed: true,
        membershipVersion: 8,
      });
    });
  });
});
