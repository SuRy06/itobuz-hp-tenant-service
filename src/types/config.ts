export type ProjectConfiguration = {
  SERVER: {
    PORT: number;
  };
  SERVICE_NAME: string;
  LOG_LEVEL: string;
  MAX_SESSION_TTL_DAYS: number;
  MONGODB: {
    URI: string;
    DB_NAME: string;
    POOL_SIZE: number;
    CONNECTION_TIMEOUT: number;
    SOCKET_TIMEOUT: number;
    SERVER_SELECTION_TIMEOUT: number;
    HEARTBEAT_FREQUENCY: number;
  };
  OAUTH_SERVICE_URL: string;
  AWS: {
    ROLE_ARN: string;
    REGION: string;
  };
};

export type QueryObj = {
  limit: number;
  offset: number;
};

export enum OrganizationTypeEnum {
  "DIRECT" = "DIRECT",
  "MSP" = "MSP",
  "INTERNAL" = "INTERNAL",
}
export enum OrganizationStatusEnum {
  "ACTIVE" = "ACTIVE",
  "SUSPENDED" = "SUSPENDED",
  "DEACTIVATED" = "DEACTIVATED",
}
export enum OrganizationMembershipRoleEnum {
  "ORG_OWNER" = "ORG_OWNER",
  "ORG_ADMIN" = "ORG_ADMIN",
  "BILLING_ADMIN" = "BILLING_ADMIN",
  "SUPPORT" = "SUPPORT",
}
export enum OrganizationMembershipStatusEnum {
  "ACTIVE" = "ACTIVE",
  "SUSPENDED" = "SUSPENDED",
}

export enum TenantStatusEnum {
  "ACTIVE" = "ACTIVE",
  "SUSPENDED" = "SUSPENDED",
  "DEACTIVATED" = "DEACTIVATED",
}

export enum TenantMembershipStatusEnum {
  "INVITED" = "INVITED",
  "ACTIVE" = "ACTIVE",
  "SUSPENDED" = "SUSPENDED",
  "EXPIRED" = "EXPIRED",
}

export enum GroupStatusEnum {
  ACTIVE = "ACTIVE",
  ARCHIVED = "ARCHIVED",
}
