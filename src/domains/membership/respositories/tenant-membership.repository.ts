import { injectable } from "tsyringe";
import { MongoDBConnectionManager } from "../../../infrastructure/database/mongodbmanager.service";
import {
  getTenantMembershipModel,
  membershipStatus,
  tenantMembershipInterface,
} from "../models/tenant-membership.model";

interface updateRolesInput {
  tenantId: string;
  userId: string;
  add: string[];
  remove: string[];
}

@injectable()
export class TenantMembershipRepository {
  constructor(private readonly mongoDBConnectionManager: MongoDBConnectionManager) {}

  async updateRolesAtomic(input: updateRolesInput): Promise<tenantMembershipInterface | null> {
    const { tenantId, userId, add, remove } = input;

    const connection = this.mongoDBConnectionManager.getConnection();
    const MembershipModel = getTenantMembershipModel(connection);

    const update: any = {
      $inc: { membershipVersion: 1 },
    };

    if (add.length) {
      update.$addToSet = {
        roles: { $each: add },
      };
    }

    if (remove.length) {
      update.$pullAll = {
        roles: remove,
      };
    }

    return MembershipModel.findOneAndUpdate(
      {
        tenantId: tenantId,
        userId: userId,
      },
      update,
      { new: true }
    ).lean<tenantMembershipInterface>();
  }

  async findByTenantAndUser(tenantId: string, userId: string): Promise<tenantMembershipInterface | null> {
    const connection = this.mongoDBConnectionManager.getConnection();
    const MembershipModel = getTenantMembershipModel(connection);
    return MembershipModel.findOne({
      tenantId: tenantId,
      userId: userId,
    }).lean<tenantMembershipInterface>();
  }

  async increaseVersion(tenantId: string, userId: string): Promise<tenantMembershipInterface> {
    const connection = this.mongoDBConnectionManager.getConnection();
    const MembershipModel = getTenantMembershipModel(connection);
    const updated = await MembershipModel.findOneAndUpdate(
      { tenantId: tenantId, userId: userId },
      { $inc: { membershipVersion: 1 } },
      { new: true }
    ).lean<tenantMembershipInterface>();

    if (!updated) {
      throw new Error("Membership not found while bumping version");
    }

    return updated;
  }

  async updateStatus(
    tenantId: string,
    userId: string,
    status: membershipStatus
  ): Promise<tenantMembershipInterface | null> {
    const connection = this.mongoDBConnectionManager.getConnection();
    const MembershipModel = getTenantMembershipModel(connection);
    const updated = await MembershipModel.findOneAndUpdate(
      { tenantId: tenantId, userId: userId },
      {
        $set: { status },
        $inc: { membershipVersion: 1 },
      },
      { new: true }
    ).lean<tenantMembershipInterface>();

    return updated;
  }
}
