import mongoose, { Document, Schema, Model } from "mongoose";

import {
  OrganizationMembershipRoleEnum,
  OrganizationMembershipStatusEnum,
} from "../../../types/config";
import { OrganizationMembershipInterface } from "../interfaces/organizationMembership.interface";

export const OrganizationMembershipSchema =
  new Schema<OrganizationMembershipInterface>({
    orgId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(OrganizationMembershipRoleEnum),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(OrganizationMembershipStatusEnum),
      required: true,
      default: OrganizationMembershipStatusEnum.ACTIVE,
    },
  });

OrganizationMembershipSchema.index({ orgId: 1, userId: 1 }, { unique: true });

export function getOrganizationMembershipModel(
  connection: mongoose.Connection
): Model<OrganizationMembershipInterface> {
  return connection.model<OrganizationMembershipInterface>(
    "OrganizationMembership",
    OrganizationMembershipSchema
  );
}
