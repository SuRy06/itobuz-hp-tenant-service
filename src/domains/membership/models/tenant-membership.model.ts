import mongoose, { Schema, Document, Model } from "mongoose";
import { v4 as uuidv4 } from "uuid";

export type membershipStatus = "ACTIVE" | "SUSPENDED" | "REVOKED";

export interface tenantMembershipInterface extends Document {
  membershipId: string;

  tenantId: string;
  userId: string;

  roles: string[];

  status: membershipStatus;
  expiresAt?: Date | null;

  membershipVersion: number;

  createdAt: Date;
  updatedAt: Date;
}

const tenantMembershipSchema = new Schema<tenantMembershipInterface>(
  {
    membershipId: {
      type: String,
      default: uuidv4,
      immutable: true,
      index: true,
    },

    tenantId: {
      type: String,
      required: true,
    },

    userId: {
      type: String,
      required: true,
    },

    roles: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED", "REVOKED"],
      default: "ACTIVE",
      uppercase: true,
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    membershipVersion: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  {
    timestamps: true,
  }
);

tenantMembershipSchema.index({ tenantId: 1, userId: 1 }, { unique: true });

export const getTenantMembershipModel = (connection: mongoose.Connection): Model<tenantMembershipInterface> => {
  return connection.model<tenantMembershipInterface>("TenantMembership", tenantMembershipSchema);
};
