import { injectable } from "tsyringe";
import { getOrganizationMembershipModel } from "../models/organizationMembership.model";
import { OrganizationMembershipInterface } from "../interfaces/organizationMembership.interface";
import { MongoDBConnectionManager } from "../../../infrastructure/database/mongodbmanager.service";

@injectable()
export class OrganizationMembershipRepository {
  constructor(private readonly mongoManager: MongoDBConnectionManager) {}

  async create(
    membershipData: Partial<OrganizationMembershipInterface>
  ): Promise<OrganizationMembershipInterface> {
    const OrganizationMembership = getOrganizationMembershipModel(
      this.mongoManager.getConnection()
    );
    const membership = new OrganizationMembership(membershipData);
    return await membership.save();
  }

  async findByOrgAndUser(
    orgId: string,
    userId: string
  ): Promise<OrganizationMembershipInterface | null> {
    const OrganizationMembership = getOrganizationMembershipModel(
      this.mongoManager.getConnection()
    );
    return await OrganizationMembership.findOne({ orgId, userId }).exec();
  }

  async findByOrg(orgId: string): Promise<OrganizationMembershipInterface[]> {
    const OrganizationMembership = getOrganizationMembershipModel(
      this.mongoManager.getConnection()
    );
    return await OrganizationMembership.find({ orgId }).exec();
  }
}
