import { TenantStatusEnum } from "../../../types/config";

export interface TenantInterface {
  tenantId: string;
  orgId: string;
  name: string;
  status: TenantStatusEnum;
  deactivatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BootstrapOptions {
  createDefaultRoles: boolean;
}

export interface CreateTenantDTO {
  orgId: string;
  name: string;
  bootstrap?: BootstrapOptions;
}

export interface DeactivateTenantDTO {
  reason?: string;
}
