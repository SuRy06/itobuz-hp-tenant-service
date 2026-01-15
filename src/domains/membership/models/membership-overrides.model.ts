// src/domains/tenant-membership/models/membership-permission-override.model.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export type permissionOverrideEffect = "ALLOW" | "DENY";

export interface membershipPermissionOverrideInterface extends Document {
  tenantId: string;
  userId: string;

  permissionId: string;

  effect: permissionOverrideEffect;
  reason?: string | null;

  createdAt: Date;
  updatedAt: Date;
}

const MembershipPermissionOverrideSchema = new Schema<membershipPermissionOverrideInterface>(
  {
    tenantId: {
      type: String,
      required: true,
    },

    userId: {
      type: String,
      required: true,
    },

    permissionId: {
      type: String,
      required: true,
    },

    effect: {
      type: String,
      enum: ["ALLOW", "DENY"],
      required: true,
      uppercase: true,
    },

    reason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

MembershipPermissionOverrideSchema.index({ tenantId: 1, userId: 1, permissionId: 1 }, { unique: true });

MembershipPermissionOverrideSchema.index({ tenantId: 1, userId: 1 });

export const getMembershipPermissionOverrideModel = (
  connection: mongoose.Connection
): Model<membershipPermissionOverrideInterface> => {
  return connection.model<membershipPermissionOverrideInterface>(
    "MembershipPermissionOverride",
    MembershipPermissionOverrideSchema
  );
};
