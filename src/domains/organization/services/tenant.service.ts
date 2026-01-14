import { v4 as uuid4 } from "uuid";
import { injectable } from "tsyringe";
import {
  CreateTenantDTO,
  TenantInterface,
  DeactivateTenantDTO,
} from "../interfaces/tenant.interface";
import {
  AddUserToTenantDTO,
  TenantMembershipInterface,
} from "../interfaces/tenantMembership.interface";
import { TenantRepository } from "../repositories/tenant.repository";
import { OrganizationRepository } from "../repositories/organization.repository";
import { TenantMembershipRepository } from "../repositories/tenantMembership.repository";
import {
  TenantStatusEnum,
  OrganizationStatusEnum,
  TenantMembershipStatusEnum,
} from "../../../types/config";
import { HttpError } from "../../common/errors/http.error";

@injectable()
export class TenantService {
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly organizationRepository: OrganizationRepository,
    private readonly tenantMembershipRepository: TenantMembershipRepository
  ) {}

  async createTenant(data: CreateTenantDTO): Promise<TenantInterface> {
    try {
      // Validate organization exists and is ACTIVE
      const organization = await this.organizationRepository.findById(
        data.orgId
      );

      if (!organization) {
        throw new HttpError(404, "Organization not found");
      }

      if (organization.status !== OrganizationStatusEnum.ACTIVE) {
        throw new HttpError(
          400,
          "Organization must be ACTIVE to create tenants"
        );
      }

      // TODO: Check org-level permission (e.g. ORG_TENANT_CREATE)
      // This would require auth middleware to be implemented

      // Generate unique tenantId
      const tenantId = uuid4();

      // Create tenant with default status as ACTIVE
      const tenant = await this.tenantRepository.create({
        tenantId,
        orgId: data.orgId,
        name: data.name,
        status: TenantStatusEnum.ACTIVE,
      });

      // Todo:Bootstrap default roles and owner membership if enabled

      return tenant;
    } catch (error: any) {
      throw error;
    }
  }

  async deactivateTenant(
    tenantId: string,
    data: DeactivateTenantDTO
  ): Promise<TenantInterface> {
    try {
      // Find tenant
      const tenant = await this.tenantRepository.findById(tenantId);

      if (!tenant) {
        throw new HttpError(404, "Tenant not found");
      }

      // Check if already deactivated
      if (tenant.status === TenantStatusEnum.DEACTIVATED) {
        throw new HttpError(400, "Tenant is already deactivated");
      }

      // TODO: Check TENANT_DEACTIVATE permission
      // This would require auth middleware to be implemented

      // Update tenant status to DEACTIVATED
      const updatedTenant = await this.tenantRepository.update(tenantId, {
        status: TenantStatusEnum.DEACTIVATED,
        updatedAt: new Date(),
      });

      if (!updatedTenant) {
        throw new HttpError(500, "Failed to deactivate tenant");
      }

      // TODO: Log deactivation reason in audit log if provided

      return updatedTenant;
    } catch (error: any) {
      throw error;
    }
  }

  async getTenant(tenantId: string): Promise<TenantInterface> {
    try {
      // Find tenant
      const tenant = await this.tenantRepository.findById(tenantId);

      if (!tenant) {
        throw new HttpError(404, "Tenant not found");
      }

      // TODO: Enforce tenant isolation - check caller membership or org admin access
      // This would require auth middleware to validate:
      // - User has membership in this tenant, OR
      // - User is admin in the parent organization

      return tenant;
    } catch (error: any) {
      throw error;
    }
  }

  async addUserToTenant(
    tenantId: string,
    data: AddUserToTenantDTO
  ): Promise<TenantMembershipInterface> {
    try {
      // TODO: Check TENANT_USER_ADD permission
      // This would require auth middleware to be implemented

      // Validate tenant exists and is ACTIVE
      const tenant = await this.tenantRepository.findById(tenantId);

      if (!tenant) {
        throw new HttpError(404, "Tenant not found");
      }

      if (tenant.status !== TenantStatusEnum.ACTIVE) {
        throw new HttpError(400, "Tenant must be ACTIVE to add users");
      }

      // Validate organization is ACTIVE
      const organization = await this.organizationRepository.findById(
        tenant.orgId
      );

      if (!organization) {
        throw new HttpError(404, "Organization not found");
      }

      if (organization.status !== OrganizationStatusEnum.ACTIVE) {
        throw new HttpError(400, "Organization must be ACTIVE");
      }

      // Check if membership already exists
      const existingMembership =
        await this.tenantMembershipRepository.findByTenantAndUser(
          tenantId,
          data.userId
        );

      if (existingMembership) {
        // If membership exists and is INVITED, transition to ACTIVE
        if (existingMembership.status === TenantMembershipStatusEnum.INVITED) {
          const updatedMembership =
            await this.tenantMembershipRepository.update(
              tenantId,
              data.userId,
              {
                status: TenantMembershipStatusEnum.ACTIVE,
              }
            );

          if (!updatedMembership) {
            throw new HttpError(500, "Failed to update membership status");
          }

          return updatedMembership;
        }

        // If membership already exists with other status, throw conflict error
        throw new HttpError(
          409,
          `User already has ${existingMembership.status} membership in this tenant`
        );
      }

      // Create new ACTIVE membership
      const membership = await this.tenantMembershipRepository.create({
        tenantId,
        userId: data.userId,
        status: TenantMembershipStatusEnum.ACTIVE,
      });

      return membership;
    } catch (error: any) {
      throw error;
    }
  }
}
