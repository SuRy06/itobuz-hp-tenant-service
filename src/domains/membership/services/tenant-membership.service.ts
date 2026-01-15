import { injectable } from "tsyringe";
import { HttpError } from "../../common/errors/http.error";
import { TenantMembershipRepository } from "../respositories/tenant-membership.repository";
import { RoleRepository } from "../../role/repositories/role.repository";
import { MembershipOverrideRepository } from "../respositories/membership-overrides.repository";
import { PermissionRepository } from "../../permission/repositories/permission.repository";
import { permissionOverrideEffect } from "../models/membership-overrides.model";
import { membershipStatus } from "../models/tenant-membership.model";

@injectable()
export class TenantMembershipService {
  constructor(
    private readonly tenantMembershipRepository: TenantMembershipRepository,
    private readonly roleRepository: RoleRepository,
    private readonly membershipOverrideRepository: MembershipOverrideRepository,
    private readonly permissionRepository: PermissionRepository
  ) {}
  async updateMembershipRoles(tenantId: string, userId: string, add: string[], remove: string[]) {
    // TODO - check the permission of requester

    const roleIds = [...add, ...remove];
    if (!roleIds.length) {
      throw new HttpError(400, "Nothing to update");
    }

    const roles = await this.roleRepository.findByTenantAndRoleIds(tenantId, roleIds);

    if (roles.length !== roleIds.length) {
      throw new HttpError(400, "Invalid role ID(s) for tenant");
    }

    const updated = await this.tenantMembershipRepository.updateRolesAtomic({
      tenantId,
      userId,
      add,
      remove,
    });

    if (!updated) {
      throw new HttpError(404, "Tenant membership not found");
    }

    return {
      tenantId: updated.tenantId,
      userId: updated.userId,
      roleIds: updated.roles,
      membershipVersion: updated.membershipVersion,
      updatedAt: updated.updatedAt,
    };
  }

  async setOverride(
    tenantId: string,
    userId: string,
    permissionId: string,
    effect: permissionOverrideEffect,
    reason: string
  ): Promise<any> {
    // TODO - check the permission of requester

    const permission = await this.permissionRepository.findByPermissionId(permissionId);
    if (!permission) {
      throw new HttpError(400, "Invalid permissionId");
    }

    const membership = await this.tenantMembershipRepository.findByTenantAndUser(tenantId, userId);
    if (!membership) {
      throw new HttpError(404, "Membership not found");
    }

    const override = await this.membershipOverrideRepository.upsertOverride(
      tenantId,
      userId,
      permissionId,
      effect,
      reason
    );

    const updatedMembership = await this.tenantMembershipRepository.increaseVersion(tenantId, userId);

    return {
      tenantId: tenantId,
      userId: userId,
      permissionId: permissionId,
      effect: override.effect,
      membershipVersion: updatedMembership.membershipVersion,
      createdAt: override.createdAt,
    };
  }

  async removeOverride(tenantId: string, userId: string, permissionId: string): Promise<any> {
    // TODO - check the permission of requester

    const deleted = await this.membershipOverrideRepository.deleteOverride(tenantId, userId, permissionId);

    if (!deleted) {
      throw new HttpError(404, "Override not found");
    }

    const updatedMembership = await this.tenantMembershipRepository.increaseVersion(tenantId, userId);

    return {
      tenantId: tenantId,
      userId: userId,
      permissionId: permissionId,
      deleted: true,
      membershipVersion: updatedMembership.membershipVersion,
    };
  }
  async suspendMembership(
    tenantId: string,
    userId: string
  ): Promise<{
    tenantId: string;
    userId: string;
    status: membershipStatus;
    membershipVersion: number;
  }> {
    // TODO - check the permission of requester

    const membership = await this.tenantMembershipRepository.updateStatus(tenantId, userId, "SUSPENDED");

    if (!membership) {
      throw new HttpError(404, "Membership not found");
    }

    return {
      tenantId: membership.tenantId,
      userId: membership.userId,
      status: membership.status,
      membershipVersion: membership.membershipVersion,
    };
  }

  async unsuspendMembership(
    tenantId: string,
    userId: string
  ): Promise<{
    tenantId: string;
    userId: string;
    status: membershipStatus;
    membershipVersion: number;
  }> {
    // TODO - check the permission of requester

    const membership = await this.tenantMembershipRepository.updateStatus(tenantId, userId, "ACTIVE");

    if (!membership) {
      throw new HttpError(404, "Membership not found");
    }

    return {
      tenantId: membership.tenantId,
      userId: membership.userId,
      status: membership.status,
      membershipVersion: membership.membershipVersion,
    };
  }
}
