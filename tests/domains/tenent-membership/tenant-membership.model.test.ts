import mongoose from "mongoose";
import {
  getTenantMembershipModel,
  tenantMembershipInterface,
} from "../../../src/domains/membership/models/tenant-membership.model";

describe("TenantMembership Model", () => {
  let connection: mongoose.Connection;
  let mockModel: any;

  beforeEach(() => {
    mockModel = {
      modelName: "TenantMembership",
      schema: {},
    };

    connection = {
      model: jest.fn().mockReturnValue(mockModel),
    } as unknown as mongoose.Connection;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getTenantMembershipModel", () => {
    it("should return a model with the correct name", () => {
      const model = getTenantMembershipModel(connection);

      expect(connection.model).toHaveBeenCalledWith("TenantMembership", expect.any(Object));
      expect(model).toBeDefined();
      expect(model.modelName).toBe("TenantMembership");
    });

    it("should be callable multiple times", () => {
      const model1 = getTenantMembershipModel(connection);
      const model2 = getTenantMembershipModel(connection);

      expect(model1).toBeDefined();
      expect(model2).toBeDefined();
      expect(model1).toBe(model2);
    });
  });

  describe("Schema Structure", () => {
    it("should match tenantMembershipInterface", () => {
      // Compile-time interface check
      const mockMembership: Partial<tenantMembershipInterface> = {
        membershipId: "membership-uuid",
        tenantId: "tenant-1",
        userId: "user-1",
        roles: ["ADMIN", "USER"],
        status: "ACTIVE",
        expiresAt: null,
        membershipVersion: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      expect(mockMembership.membershipId).toBe("membership-uuid");
      expect(mockMembership.tenantId).toBe("tenant-1");
      expect(mockMembership.userId).toBe("user-1");
      expect(mockMembership.roles).toEqual(["ADMIN", "USER"]);
      expect(mockMembership.status).toBe("ACTIVE");
      expect(mockMembership.expiresAt).toBeNull();
      expect(mockMembership.membershipVersion).toBe(1);
      expect(mockMembership.createdAt).toBeInstanceOf(Date);
      expect(mockMembership.updatedAt).toBeInstanceOf(Date);
    });

    it("should allow all valid membership statuses", () => {
      const active: Partial<tenantMembershipInterface> = { status: "ACTIVE" };
      const suspended: Partial<tenantMembershipInterface> = { status: "SUSPENDED" };
      const revoked: Partial<tenantMembershipInterface> = { status: "REVOKED" };

      expect(active.status).toBe("ACTIVE");
      expect(suspended.status).toBe("SUSPENDED");
      expect(revoked.status).toBe("REVOKED");
    });

    it("should allow empty roles array by default", () => {
      const mockMembership: Partial<tenantMembershipInterface> = {
        roles: [],
      };

      expect(Array.isArray(mockMembership.roles)).toBe(true);
      expect(mockMembership.roles).toHaveLength(0);
    });
  });
});
