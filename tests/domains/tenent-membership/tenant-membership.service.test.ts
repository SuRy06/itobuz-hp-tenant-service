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
      await expect(service.updateMembershipRoles("t1", "u1", [], [])).rejects.toMatchObject({
        statusCode: 400,
        message: "Nothing to update",
      });
    });

    it("should throw 400 if any role ID is invalid for tenant", async () => {
      roleRepository.findByTenantAndRoleIds.mockResolvedValue([{ roleId: "r1" }] as any); // missing one role

      await expect(service.updateMembershipRoles("t1", "u1", ["r1"], ["r2"])).rejects.toMatchObject({
        statusCode: 400,
        message: "Invalid role ID(s) for tenant",
      });

      expect(roleRepository.findByTenantAndRoleIds).toHaveBeenCalledWith("t1", ["r1", "r2"]);
    });

    it("should throw 404 if tenant membership not found", async () => {
      roleRepository.findByTenantAndRoleIds.mockResolvedValue([{ roleId: "r1" }, { roleId: "r2" }] as any);

      membershipRepository.updateRolesAtomic.mockResolvedValue(null);

      await expect(service.updateMembershipRoles("t1", "u1", ["r1"], ["r2"])).rejects.toMatchObject({
        statusCode: 404,
        message: "Tenant membership not found",
      });
    });

    it("should update membership roles successfully", async () => {
      roleRepository.findByTenantAndRoleIds.mockResolvedValue([{ roleId: "r1" }, { roleId: "r2" }] as any);

      const updatedMembership = {
        tenantId: "t1",
        userId: "u1",
        roles: ["r1"],
        membershipVersion: 2,
        updatedAt: new Date(),
      };

      membershipRepository.updateRolesAtomic.mockResolvedValue(updatedMembership as any);

      const result = await service.updateMembershipRoles("t1", "u1", ["r1"], ["r2"]);

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

      await expect(service.setOverride("t1", "u1", "p1", "ALLOW", "test")).rejects.toMatchObject({
        statusCode: 400,
        message: "Invalid permissionId",
      });
    });

    it("should throw 404 if membership is not found", async () => {
      permissionRepository.findByPermissionId.mockResolvedValue({ id: "p1" } as any);
      membershipRepository.findByTenantAndUser.mockResolvedValue(null);

      await expect(service.setOverride("t1", "u1", "p1", "DENY", "reason")).rejects.toMatchObject({
        statusCode: 404,
        message: "Membership not found",
      });
    });

    it("should create override and bump membership version", async () => {
      permissionRepository.findByPermissionId.mockResolvedValue({ id: "p1" } as any);

      membershipRepository.findByTenantAndUser.mockResolvedValue({
        tenantId: "t1",
        userId: "u1",
      } as any);

      const override = {
        effect: "ALLOW",
        createdAt: new Date(),
      };

      membershipOverrideRepository.upsertOverride.mockResolvedValue(override as any);

      membershipRepository.increaseVersion.mockResolvedValue({
        membershipVersion: 2,
      } as any);

      const result = await service.setOverride("t1", "u1", "p1", "ALLOW", "reason");

      expect(membershipOverrideRepository.upsertOverride).toHaveBeenCalledWith("t1", "u1", "p1", "ALLOW", "reason");

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

      await expect(service.removeOverride("t1", "u1", "p1")).rejects.toMatchObject({
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

      expect(membershipOverrideRepository.deleteOverride).toHaveBeenCalledWith("t1", "u1", "p1");

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

      await expect(service.suspendMembership("t1", "u1")).rejects.toMatchObject({
        statusCode: 404,
        message: "Membership not found",
      });

      expect(membershipRepository.updateStatus).toHaveBeenCalledWith("t1", "u1", "SUSPENDED");
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

      expect(membershipRepository.updateStatus).toHaveBeenCalledWith("t1", "u1", "SUSPENDED");

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

      await expect(service.unsuspendMembership("t1", "u1")).rejects.toMatchObject({
        statusCode: 404,
        message: "Membership not found",
      });

      expect(membershipRepository.updateStatus).toHaveBeenCalledWith("t1", "u1", "ACTIVE");
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

      expect(membershipRepository.updateStatus).toHaveBeenCalledWith("t1", "u1", "ACTIVE");

      expect(result).toEqual({
        tenantId: "t1",
        userId: "u1",
        status: "ACTIVE",
        membershipVersion: 3,
      });
    });
  });
});
