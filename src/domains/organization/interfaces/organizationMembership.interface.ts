import {
  OrganizationMembershipRoleEnum,
  OrganizationMembershipStatusEnum,
} from "../../../types/config";

export interface OrganizationMembershipInterface extends Document {
  orgId: string;
  userId: string;
  role: OrganizationMembershipRoleEnum;
  status: OrganizationMembershipStatusEnum;
}

export interface CreateOrganizationMembershipDTO {
  userId: string;
  role: OrganizationMembershipRoleEnum;
}
