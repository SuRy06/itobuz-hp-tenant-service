import mongoose, { Schema, Model } from "mongoose";

import { GroupMembershipStatusEnum } from "../../../types/config";
import { GroupMembershipInterface } from "../interfaces/groupMembership.interface";

export const GroupMembershipSchema = new Schema<GroupMembershipInterface>({
  tenantId: {
    type: String,
    required: true,
  },
  groupId: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: Object.values(GroupMembershipStatusEnum),
    required: true,
    default: GroupMembershipStatusEnum.ACTIVE,
  },
});

// Compound unique index to enforce unique membership per user per group
GroupMembershipSchema.index({ groupId: 1, userId: 1 }, { unique: true });

export function getGroupMembershipModel(
  connection: mongoose.Connection
): Model<GroupMembershipInterface> {
  return connection.model<GroupMembershipInterface>(
    "GroupMembership",
    GroupMembershipSchema
  );
}
