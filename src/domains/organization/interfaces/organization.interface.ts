import {
  OrganizationTypeEnum,
  OrganizationStatusEnum,
} from "../../../types/config";

export interface OrganizationInterface extends Document {
  orgId: string;
  name: string;
  type: OrganizationTypeEnum;
  status: OrganizationStatusEnum;
  ownerUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrganizationDTO {
  name: string;
  type: OrganizationTypeEnum;
  ownerUserId: string;
}
