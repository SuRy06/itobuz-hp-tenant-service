import mongoose, { Document, Schema, Model } from "mongoose";

import { TenantStatusEnum } from "../../../types/config";
import { TenantInterface } from "../interfaces/tenant.interface";

export const TenantSchema = new Schema<TenantInterface>(
  {
    tenantId: {
      type: String,
      required: true,
      unique: true,
    },
    orgId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(TenantStatusEnum),
      required: true,
      default: TenantStatusEnum.ACTIVE,
    },
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  }
);

export function getTenantModel(
  connection: mongoose.Connection
): Model<TenantInterface> {
  return connection.model<TenantInterface>("Tenant", TenantSchema);
}
