// membership-permission-override.repository.ts
import { injectable } from "tsyringe";
import { MongoDBConnectionManager } from "../../../infrastructure/database/mongodbmanager.service";
import { getMembershipPermissionOverrideModel, permissionOverrideEffect } from "../models/membership-overrides.model";

export interface MembershipPermissionOverride {
  tenantId: string;
  userId: string;
  permissionId: string;
  effect: permissionOverrideEffect;
  reason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@injectable()
export class MembershipOverrideRepository {
  constructor(private readonly mongoDBConnectionManager: MongoDBConnectionManager) {}

  async upsertOverride(
    tenantId: string,
    userId: string,
    permissionId: string,
    effect: "ALLOW" | "DENY",
    reason?: string
  ): Promise<MembershipPermissionOverride> {
    const connection = this.mongoDBConnectionManager.getConnection();
    const MembershipModel = getMembershipPermissionOverrideModel(connection);

    return MembershipModel.findOneAndUpdate(
      {
        tenantId: tenantId,
        userId: userId,
        permissionId: permissionId,
      },
      {
        $set: { effect, reason },
      },
      {
        upsert: true,
        new: true,
      }
    ).lean();
  }

  async deleteOverride(
    tenantId: string,
    userId: string,
    permissionId: string
  ): Promise<MembershipPermissionOverride | null> {
    const connection = this.mongoDBConnectionManager.getConnection();
    const MembershipModel = getMembershipPermissionOverrideModel(connection);

    return MembershipModel.findOneAndDelete({
      tenantId: tenantId,
      userId: userId,
      permissionId: permissionId,
    });
  }
}
