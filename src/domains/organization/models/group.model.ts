import mongoose, { Document, Schema, Model } from "mongoose";

import { GroupInterface } from "../interfaces/group.interface";
import { GroupStatusEnum } from "../../../types/config";

export const GroupSchema = new Schema<GroupInterface>(
  {
    groupId: {
      type: String,
      required: true,
      unique: true,
    },
    tenantId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    parentGroupId: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: Object.values(GroupStatusEnum),
      required: true,
      default: GroupStatusEnum.ACTIVE,
    },
  },
  {
    timestamps: {
      createdAt: "createdAt",
      updatedAt: false,
    },
  }
);

export function getGroupModel(
  connection: mongoose.Connection
): Model<GroupInterface> {
  return connection.model<GroupInterface>("Group", GroupSchema);
}
