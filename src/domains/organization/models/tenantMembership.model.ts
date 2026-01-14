import mongoose, { Schema, Model } from "mongoose";

import { TenantMembershipStatusEnum } from "../../../types/config";
import { TenantMembershipInterface } from "../interfaces/tenantMembership.interface";

export const TenantMembershipSchema = new Schema<TenantMembershipInterface>(
  {
    tenantId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(TenantMembershipStatusEnum),
      required: true,
      default: TenantMembershipStatusEnum.ACTIVE,
    },
    expiresAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: {
      createdAt: "createdAt",
    },
  }
);

// Compound unique index to enforce unique membership per user per tenant
TenantMembershipSchema.index({ tenantId: 1, userId: 1 }, { unique: true });

export function getTenantMembershipModel(
  connection: mongoose.Connection
): Model<TenantMembershipInterface> {
  return connection.model<TenantMembershipInterface>(
    "TenantMembership",
    TenantMembershipSchema
  );
}
