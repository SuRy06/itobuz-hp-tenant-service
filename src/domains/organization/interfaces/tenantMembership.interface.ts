import { TenantMembershipStatusEnum } from "../../../types/config";

export interface TenantMembershipInterface {
  tenantId: string;
  userId: string;
  status: TenantMembershipStatusEnum;
  expiresAt?: Date;
  createdAt: Date;
}

export interface AddUserToTenantDTO {
  userId: string;
}
