import { GroupMembershipStatusEnum } from "../../../types/config";

export interface GroupMembershipInterface {
  tenantId: string;
  groupId: string;
  userId: string;
  status: GroupMembershipStatusEnum;
}

export interface AddUserToGroupDTO {
  userId: string;
}
