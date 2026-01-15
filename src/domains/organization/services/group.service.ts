import { v4 as uuid4 } from "uuid";
import { injectable } from "tsyringe";
import { CreateGroupDTO, GroupInterface } from "../interfaces/group.interface";
import { AddUserToGroupDTO, GroupMembershipInterface } from "../interfaces/groupMembership.interface";
import { GroupRepository } from "../repositories/group.repository";
import { TenantRepository } from "../repositories/tenant.repository";
import { GroupMembershipRepository } from "../repositories/groupMembership.repository";
import { TenantMembershipRepository } from "../repositories/tenantMembership.repository";
import {
  GroupStatusEnum,
  TenantStatusEnum,
  GroupMembershipStatusEnum,
  TenantMembershipStatusEnum,
} from "../../../types/config";
import { HttpError } from "../../common/errors/http.error";

@injectable()
export class GroupService {
  constructor(
    private readonly groupRepository: GroupRepository,
    private readonly tenantRepository: TenantRepository,
    private readonly groupMembershipRepository: GroupMembershipRepository,
    private readonly tenantMembershipRepository: TenantMembershipRepository
  ) {}

  async createGroup(data: CreateGroupDTO): Promise<GroupInterface> {
    try {
      // Validate tenant exists and is ACTIVE
      const tenant = await this.tenantRepository.findById(data.tenantId);

      if (!tenant) {
        throw new HttpError(404, "Tenant not found");
      }

      if (tenant.status !== TenantStatusEnum.ACTIVE) {
        throw new HttpError(400, "Tenant must be ACTIVE to create groups");
      }

      // TODO: Check tenant-level permission (GROUP_CREATE)
      // This would require auth middleware to be implemented

      // If parentGroupId is provided, validate it exists and belongs to same tenant
      if (data.parentGroupId) {
        const parentGroup = await this.groupRepository.findByIdAndTenant(data.parentGroupId, data.tenantId);

        if (!parentGroup) {
          throw new HttpError(404, "Parent group not found or does not belong to this tenant");
        }

        if (parentGroup.status === GroupStatusEnum.ARCHIVED) {
          throw new HttpError(400, "Cannot create group under archived parent");
        }
      }

      // Check for duplicate name under same parent within tenant
      const existingGroup = await this.groupRepository.findByNameAndParent(
        data.tenantId,
        data.name.trim(),
        data.parentGroupId || null
      );

      if (existingGroup) {
        throw new HttpError(409, "Group with this name already exists under the same parent");
      }

      // Generate unique groupId
      const groupId = uuid4();

      // Create group with default status as ACTIVE
      const group = await this.groupRepository.create({
        groupId,
        tenantId: data.tenantId,
        name: data.name.trim(),
        parentGroupId: data.parentGroupId || undefined,
        status: GroupStatusEnum.ACTIVE,
      });

      return group;
    } catch (error: any) {
      throw error;
    }
  }

  async addUserToGroup(tenantId: string, groupId: string, data: AddUserToGroupDTO): Promise<GroupMembershipInterface> {
    try {
      // TODO: Check GROUP_USER_ADD permission
      // This would require auth middleware to be implemented

      // Validate group exists and belongs to tenant
      const group = await this.groupRepository.findByIdAndTenant(groupId, tenantId);

      if (!group) {
        throw new HttpError(404, "Group not found or does not belong to this tenant");
      }

      if (group.status !== GroupStatusEnum.ACTIVE) {
        throw new HttpError(400, "Group must be ACTIVE to add users");
      }

      // Validate tenant exists and is ACTIVE
      const tenant = await this.tenantRepository.findById(tenantId);

      if (!tenant) {
        throw new HttpError(404, "Tenant not found");
      }

      if (tenant.status !== TenantStatusEnum.ACTIVE) {
        throw new HttpError(400, "Tenant must be ACTIVE");
      }

      // Validate user is ACTIVE member of tenant
      const tenantMembership = await this.tenantMembershipRepository.findByTenantAndUser(tenantId, data.userId);

      if (!tenantMembership) {
        throw new HttpError(400, "User must be a member of the tenant before joining a group");
      }

      if (tenantMembership.status !== TenantMembershipStatusEnum.ACTIVE) {
        throw new HttpError(400, `User must be an ACTIVE tenant member. Current status: ${tenantMembership.status}`);
      }

      // Check if membership already exists
      const existingMembership = await this.groupMembershipRepository.findByGroupAndUser(groupId, data.userId);

      if (existingMembership) {
        throw new HttpError(409, `User already has ${existingMembership.status} membership in this group`);
      }

      // Create new ACTIVE membership
      const membership = await this.groupMembershipRepository.create({
        tenantId,
        groupId,
        userId: data.userId,
        status: GroupMembershipStatusEnum.ACTIVE,
      });

      return membership;
    } catch (error: any) {
      throw error;
    }
  }

  async removeUserFromGroup(
    tenantId: string,
    groupId: string,
    userId: string
  ): Promise<{
    tenantId: string;
    groupId: string;
    userId: string;
    deleted: boolean;
  }> {
    try {
      // TODO: Check GROUP_USER_REMOVE permission
      // This would require auth middleware to be implemented

      // Validate group exists and belongs to tenant
      const group = await this.groupRepository.findByIdAndTenant(
        groupId,
        tenantId
      );

      if (!group) {
        throw new HttpError(
          404,
          "Group not found or does not belong to this tenant"
        );
      }

      // Validate tenant exists
      const tenant = await this.tenantRepository.findById(tenantId);

      if (!tenant) {
        throw new HttpError(404, "Tenant not found");
      }

      // Attempt to delete the membership (idempotent)
      await this.groupMembershipRepository.deleteByGroupAndUser(
        groupId,
        userId
      );

      // Always return deleted: true (idempotent behavior)
      return {
        tenantId,
        groupId,
        userId,
        deleted: true,
      };
    } catch (error: any) {
      throw error;
    }
  }
}
