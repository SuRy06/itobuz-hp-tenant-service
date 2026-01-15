import { v4 as uuid4 } from "uuid";
import { injectable } from "tsyringe";
import { CreateGroupDTO, GroupInterface } from "../interfaces/group.interface";
import { GroupRepository } from "../repositories/group.repository";
import { TenantRepository } from "../repositories/tenant.repository";
import { GroupStatusEnum, TenantStatusEnum } from "../../../types/config";
import { HttpError } from "../../common/errors/http.error";

@injectable()
export class GroupService {
  constructor(
    private readonly groupRepository: GroupRepository,
    private readonly tenantRepository: TenantRepository
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
        const parentGroup = await this.groupRepository.findByIdAndTenant(
          data.parentGroupId,
          data.tenantId
        );

        if (!parentGroup) {
          throw new HttpError(
            404,
            "Parent group not found or does not belong to this tenant"
          );
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
        throw new HttpError(
          409,
          "Group with this name already exists under the same parent"
        );
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
}
