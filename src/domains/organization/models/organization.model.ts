import mongoose, { Document, Schema, Model } from "mongoose";

import {
  OrganizationTypeEnum,
  OrganizationStatusEnum,
} from "../../../types/config";
import { OrganizationInterface } from "../interfaces/organization.interface";

export const OrganizationSchema = new Schema<OrganizationInterface>(
  {
    orgId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: Object.values(OrganizationTypeEnum),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(OrganizationStatusEnum),
      required: true,
      default: OrganizationStatusEnum.ACTIVE,
    },
    ownerUserId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    },
  }
);

export function getOrganizationModel(
  connection: mongoose.Connection
): Model<OrganizationInterface> {
  return connection.model<OrganizationInterface>(
    "Organization",
    OrganizationSchema
  );
}
