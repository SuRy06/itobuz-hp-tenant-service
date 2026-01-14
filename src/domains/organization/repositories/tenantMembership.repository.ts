import { injectable } from "tsyringe";
import { getTenantMembershipModel } from "../models/tenantMembership.model";
import { TenantMembershipInterface } from "../interfaces/tenantMembership.interface";
import { MongoDBConnectionManager } from "../../../infrastructure/database/mongodbmanager.service";

@injectable()
export class TenantMembershipRepository {
  constructor(private readonly mongoManager: MongoDBConnectionManager) {}

  async create(
    membershipData: Partial<TenantMembershipInterface>
  ): Promise<TenantMembershipInterface> {
    const TenantMembership = getTenantMembershipModel(
      this.mongoManager.getConnection()
    );
    const membership = new TenantMembership(membershipData);
    return await membership.save();
  }

  async findByTenantAndUser(
    tenantId: string,
    userId: string
  ): Promise<TenantMembershipInterface | null> {
    const TenantMembership = getTenantMembershipModel(
      this.mongoManager.getConnection()
    );
    return await TenantMembership.findOne({ tenantId, userId }).exec();
  }

  async update(
    tenantId: string,
    userId: string,
    updateData: Partial<TenantMembershipInterface>
  ): Promise<TenantMembershipInterface | null> {
    const TenantMembership = getTenantMembershipModel(
      this.mongoManager.getConnection()
    );
    return await TenantMembership.findOneAndUpdate(
      { tenantId, userId },
      { $set: updateData },
      { new: true }
    ).exec();
  }
}
