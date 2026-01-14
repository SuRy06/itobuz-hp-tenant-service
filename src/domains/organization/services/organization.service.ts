import { v4 as uuid4 } from "uuid";
import { injectable } from "tsyringe";
import {
  CreateOrganizationDTO,
  OrganizationInterface,
} from "../interfaces/organization.interface";
import { CreateOrganizationMembershipDTO } from "../interfaces/organizationMembership.interface";
import { OrganizationRepository } from "../repositories/organization.repository";
import { OrganizationMembershipRepository } from "../repositories/organizationMembership.repository";
import { OrganizationMembershipInterface } from "../interfaces/organizationMembership.interface";
import {
  OrganizationStatusEnum,
  OrganizationMembershipStatusEnum,
} from "../../../types/config";
import { ConflictError } from "../../common/errors/conflict-error";
import { NotFoundError } from "../../common/errors/not-found-error";

@injectable()
export class OrganizationService {
  constructor(
    private readonly organizationRepository: OrganizationRepository,
    private readonly organizationMembershipRepository: OrganizationMembershipRepository
  ) {}

  async createOrganization(
    data: CreateOrganizationDTO
  ): Promise<OrganizationInterface> {
    try {
      // Generate unique orgId
      const orgId = uuid4();

      // Create organization with default status as ACTIVE
      const organization = await this.organizationRepository.create({
        orgId,
        name: data.name,
        type: data.type,
        status: OrganizationStatusEnum.ACTIVE,
        ownerUserId: data.ownerUserId,
      });

      return organization;
    } catch (error: any) {
      // Handle duplicate org name or other database errors
      if (error.code === 11000) {
        throw new Error("Organization with this name already exists");
      }
      throw error;
    }
  }

  async addOrganizationMember(
    orgId: string,
    data: CreateOrganizationMembershipDTO
  ): Promise<OrganizationMembershipInterface> {
    try {
      // Check if organization exists
      const organization = await this.organizationRepository.findById(orgId);
      if (!organization) {
        throw new NotFoundError("Organization not found");
      }

      // Check if membership already exists (idempotent)
      const existingMembership =
        await this.organizationMembershipRepository.findByOrgAndUser(
          orgId,
          data.userId
        );

      if (existingMembership) {
        // Return existing membership if it matches the requested role
        if (existingMembership.role === data.role) {
          return existingMembership;
        }
        // Otherwise, reject duplicate membership with different role
        throw new ConflictError(
          "User is already a member of this organization with a different role"
        );
      }

      // Create organization membership with ACTIVE status
      const membership = await this.organizationMembershipRepository.create({
        orgId,
        userId: data.userId,
        role: data.role,
        status: OrganizationMembershipStatusEnum.ACTIVE,
      });

      return membership;
    } catch (error: any) {
      // Re-throw known errors
      if (error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }

      // Handle duplicate membership at DB level (unique index)
      if (error.code === 11000) {
        throw new ConflictError(
          "User is already a member of this organization"
        );
      }

      throw error;
    }
  }
}
