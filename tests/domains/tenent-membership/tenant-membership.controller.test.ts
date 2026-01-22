import "reflect-metadata";
import { Request, Response, NextFunction } from "express";
import { TenantMembershipController } from "../../../src/domains/membership/controllers/tenant-membership.controller";
import { TenantMembershipService } from "../../../src/domains/membership/services/tenant-membership.service";
import { HttpError } from "../../../src/domains/common/errors/http.error";
import * as validators from "../../../src/domains/membership/validation/tenant-membership.validator";

jest.mock("../../../src/domains/membership/services/tenant-membership.service");
jest.mock(
  "../../../src/domains/membership/validation/tenant-membership.validator"
);

describe("TenantMembershipController", () => {
  let controller: TenantMembershipController;
  let mockService: jest.Mocked<TenantMembershipService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    mockService = {
      updateMembershipRoles: jest.fn(),
      setOverride: jest.fn(),
      removeOverride: jest.fn(),
      suspendMembership: jest.fn(),
      unsuspendMembership: jest.fn(),
      assignPermissionsToUser: jest.fn(),
      assignRoleToUser: jest.fn(),
    } as any;

    controller = new TenantMembershipController(mockService);

    mockRequest = {
      params: {},
      body: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("updateTenantMembershipRole", () => {
    it("should update membership roles successfully", async () => {
      mockRequest.params = { tenantId: "tenant1", userId: "user1" };
      mockRequest.body = { add: ["role1"], remove: ["role2"] };

      const mockResult = {
        tenantId: "tenant1",
        userId: "user1",
        roleIds: ["role1"],
        membershipVersion: 2,
        updatedAt: new Date(),
      };

      (
        validators.updateMembershipRolesSchema.validate as jest.Mock
      ).mockReturnValue({});
      mockService.updateMembershipRoles.mockResolvedValue(mockResult);

      await controller.updateTenantMembershipRole(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.updateMembershipRoles).toHaveBeenCalledWith(
        "tenant1",
        "user1",
        ["role1"],
        ["role2"]
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it("should handle validation error", async () => {
      mockRequest.body = {};
      (
        validators.updateMembershipRolesSchema.validate as jest.Mock
      ).mockReturnValue({
        error: { details: [{ message: "Validation failed" }] },
      });

      await controller.updateTenantMembershipRole(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(HttpError));
    });
  });

  describe("allowPermissionOverride", () => {
    it("should allow permission override successfully", async () => {
      mockRequest.params = { tenantId: "tenant1", userId: "user1" };
      mockRequest.body = { permissionId: "perm1", reason: "test reason" };

      const mockResult = {
        tenantId: "tenant1",
        userId: "user1",
        permissionId: "perm1",
        effect: "ALLOW" as const,
        membershipVersion: 2,
        createdAt: new Date(),
      };

      (
        validators.permissionOverrideSchema.validate as jest.Mock
      ).mockReturnValue({});
      mockService.setOverride.mockResolvedValue(mockResult);

      await controller.allowPermissionOverride(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.setOverride).toHaveBeenCalledWith(
        "tenant1",
        "user1",
        "perm1",
        "ALLOW",
        "test reason"
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it("should handle validation error", async () => {
      (
        validators.permissionOverrideSchema.validate as jest.Mock
      ).mockReturnValue({
        error: { details: [{ message: "Validation failed" }] },
      });

      await controller.allowPermissionOverride(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(HttpError));
    });
  });

  describe("denyPermissionOverride", () => {
    it("should deny permission override successfully", async () => {
      mockRequest.params = { tenantId: "tenant1", userId: "user1" };
      mockRequest.body = { permissionId: "perm1", reason: "test reason" };

      const mockResult = {
        tenantId: "tenant1",
        userId: "user1",
        permissionId: "perm1",
        effect: "DENY" as const,
        membershipVersion: 2,
        createdAt: new Date(),
      };

      (
        validators.permissionOverrideSchema.validate as jest.Mock
      ).mockReturnValue({});
      mockService.setOverride.mockResolvedValue(mockResult);

      await controller.denyPermissionOverride(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.setOverride).toHaveBeenCalledWith(
        "tenant1",
        "user1",
        "perm1",
        "DENY",
        "test reason"
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });
  });

  describe("removePermissionOverride", () => {
    it("should remove permission override successfully", async () => {
      mockRequest.params = {
        tenantId: "tenant1",
        userId: "user1",
        permissionId: "perm1",
      };

      const mockResult = {
        tenantId: "tenant1",
        userId: "user1",
        permissionId: "perm1",
        deleted: true,
        membershipVersion: 3,
      };

      mockService.removeOverride.mockResolvedValue(mockResult);

      await controller.removePermissionOverride(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.removeOverride).toHaveBeenCalledWith(
        "tenant1",
        "user1",
        "perm1"
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });
  });

  describe("suspendTenantMember", () => {
    it("should suspend tenant member successfully", async () => {
      mockRequest.params = { tenantId: "tenant1", userId: "user1" };
      mockRequest.body = {};

      const mockResult = {
        tenantId: "tenant1",
        userId: "user1",
        status: "SUSPENDED" as const,
        membershipVersion: 2,
      };

      (
        validators.suspendTenantMemberSchema.validate as jest.Mock
      ).mockReturnValue({});
      mockService.suspendMembership.mockResolvedValue(mockResult);

      await controller.suspendTenantMember(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.suspendMembership).toHaveBeenCalledWith(
        "tenant1",
        "user1"
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });
  });

  describe("unsuspendTenantMember", () => {
    it("should unsuspend tenant member successfully", async () => {
      mockRequest.params = { tenantId: "tenant1", userId: "user1" };

      const mockResult = {
        tenantId: "tenant1",
        userId: "user1",
        status: "ACTIVE" as const,
        membershipVersion: 3,
      };

      mockService.unsuspendMembership.mockResolvedValue(mockResult);

      await controller.unsuspendTenantMember(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.unsuspendMembership).toHaveBeenCalledWith(
        "tenant1",
        "user1"
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });
  });

  describe("assignRoleToUser", () => {
    it("should assign role successfully", async () => {
      mockRequest.params = { tenantId: "tenant1", userId: "user1" };
      mockRequest.body = { roleId: "role1" };

      const serviceResponse = {
        tenantId: "tenant1",
        userId: "user1",
        roleId: "role1",
        membershipVersion: 5,
      };

      (validators.assignRoleSchema.validate as jest.Mock).mockReturnValue({});
      mockService.assignRoleToUser.mockResolvedValue(serviceResponse);

      await controller.assignRoleToUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.assignRoleToUser).toHaveBeenCalledWith(
        "tenant1",
        "user1",
        "role1"
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(serviceResponse);
    });

    it("should handle validation errors", async () => {
      mockRequest.params = { tenantId: "tenant1", userId: "user1" };
      mockRequest.body = {};

      (validators.assignRoleSchema.validate as jest.Mock).mockReturnValue({
        error: { details: [{ message: "roleId is required" }] },
      });

      await controller.assignRoleToUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: "roleId is required",
        })
      );
    });

    it("should handle service errors", async () => {
      mockRequest.params = { tenantId: "tenant1", userId: "user1" };
      mockRequest.body = { roleId: "role1" };

      const serviceError = new HttpError(404, "Membership not found");
      (validators.assignRoleSchema.validate as jest.Mock).mockReturnValue({});
      mockService.assignRoleToUser.mockRejectedValue(serviceError);

      await controller.assignRoleToUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });

    it("should handle service errors for allow permission override", async () => {
      mockRequest.params = { tenantId: "tenant1", userId: "user1" };
      mockRequest.body = { permissionId: "perm1", reason: "test reason" };

      const serviceError = new Error("Service failed");
      (
        validators.permissionOverrideSchema.validate as jest.Mock
      ).mockReturnValue({});
      mockService.setOverride.mockRejectedValue(serviceError);

      await controller.allowPermissionOverride(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });

    it("should handle validation error for deny permission override", async () => {
      (
        validators.permissionOverrideSchema.validate as jest.Mock
      ).mockReturnValue({
        error: { details: [{ message: "Validation failed" }] },
      });

      await controller.denyPermissionOverride(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(HttpError));
    });

    it("should handle service errors for deny permission override", async () => {
      mockRequest.params = { tenantId: "tenant1", userId: "user1" };
      mockRequest.body = { permissionId: "perm1", reason: "test reason" };

      const serviceError = new Error("Service failed");
      (
        validators.permissionOverrideSchema.validate as jest.Mock
      ).mockReturnValue({});
      mockService.setOverride.mockRejectedValue(serviceError);

      await controller.denyPermissionOverride(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });

    it("should handle service errors for remove permission override", async () => {
      mockRequest.params = {
        tenantId: "tenant1",
        userId: "user1",
        permissionId: "perm1",
      };

      const serviceError = new Error("Service failed");
      mockService.removeOverride.mockRejectedValue(serviceError);

      await controller.removePermissionOverride(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });

    it("should handle validation error for suspend tenant member", async () => {
      (
        validators.suspendTenantMemberSchema.validate as jest.Mock
      ).mockReturnValue({
        error: { details: [{ message: "Validation failed" }] },
      });

      await controller.suspendTenantMember(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(HttpError));
    });

    it("should handle service errors for suspend tenant member", async () => {
      mockRequest.params = { tenantId: "tenant1", userId: "user1" };
      mockRequest.body = {};

      const serviceError = new Error("Service failed");
      (
        validators.suspendTenantMemberSchema.validate as jest.Mock
      ).mockReturnValue({});
      mockService.suspendMembership.mockRejectedValue(serviceError);

      await controller.suspendTenantMember(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });

    it("should handle service errors for unsuspend tenant member", async () => {
      mockRequest.params = { tenantId: "tenant1", userId: "user1" };

      const serviceError = new Error("Service failed");
      mockService.unsuspendMembership.mockRejectedValue(serviceError);

      await controller.unsuspendTenantMember(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });

    it("should handle service errors for update membership roles", async () => {
      mockRequest.params = { tenantId: "tenant1", userId: "user1" };
      mockRequest.body = { add: ["role1"], remove: ["role2"] };

      const serviceError = new Error("Service failed");
      (
        validators.updateMembershipRolesSchema.validate as jest.Mock
      ).mockReturnValue({});
      mockService.updateMembershipRoles.mockRejectedValue(serviceError);

      await controller.updateTenantMembershipRole(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });

  describe("assignPermissionsToUser", () => {
    it("should assign permissions successfully", async () => {
      mockRequest.params = { tenantId: "tenant1", userId: "user1" };
      mockRequest.body = { permissionIds: ["perm1", "perm2"] };

      const serviceResponse = {
        tenantId: "tenant1",
        userId: "user1",
        permissionIds: ["perm1", "perm2"],
        membershipVersion: 5,
      };

      (
        validators.assignPermissionsSchema.validate as jest.Mock
      ).mockReturnValue({});
      mockService.assignPermissionsToUser.mockResolvedValue(serviceResponse);

      await controller.assignPermissionsToUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockService.assignPermissionsToUser).toHaveBeenCalledWith(
        "tenant1",
        "user1",
        ["perm1", "perm2"]
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(serviceResponse);
    });

    it("should handle validation errors", async () => {
      mockRequest.params = { tenantId: "tenant1", userId: "user1" };
      mockRequest.body = {};

      (
        validators.assignPermissionsSchema.validate as jest.Mock
      ).mockReturnValue({
        error: { details: [{ message: "permissionIds is required" }] },
      });

      await controller.assignPermissionsToUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: "permissionIds is required",
        })
      );
    });

    it("should handle service errors", async () => {
      mockRequest.params = { tenantId: "tenant1", userId: "user1" };
      mockRequest.body = { permissionIds: ["perm1", "perm2"] };

      const serviceError = new HttpError(404, "Membership not found");
      (
        validators.assignPermissionsSchema.validate as jest.Mock
      ).mockReturnValue({});
      mockService.assignPermissionsToUser.mockRejectedValue(serviceError);

      await controller.assignPermissionsToUser(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalledWith(serviceError);
    });
  });
});
