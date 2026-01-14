import { Document } from "mongoose";
import { GroupStatusEnum } from "../../../types/config";

export interface GroupInterface extends Document {
  groupId: string;
  tenantId: string;
  name: string;
  parentGroupId?: string;
  status: GroupStatusEnum;
  createdAt: Date;
}

export interface CreateGroupDTO {
  tenantId: string;
  name: string;
  parentGroupId?: string;
}
