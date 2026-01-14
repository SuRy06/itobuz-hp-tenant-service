import "reflect-metadata";
import { Request, Response, NextFunction } from "express";
import { TenantController } from "../../../../src/domains/organization/controllers/tenant.controller";
import { TenantService } from "../../../../src/domains/organization/services/tenant.service";
import { HttpError } from "../../../../src/domains/common/errors/http.error";
import {
  TenantStatusEnum,
  TenantMembershipStatusEnum,
} from "../../../../src/types/config";

describe("TenantController", () => {
  let tenantController: TenantController;
  let mockTenantService: jest.Mocked<TenantService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Create mock service
    mockTenantService = {
      createTenant: jest.fn(),
    } as any;

    // Create controller instance
    tenantController = new TenantController(mockTenantService);

    // Setup mock request, response, and next
    mockRequest = {
      params: {},
      body: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createTenant", () => {
    it("should successfully create a tenant and return 201 status", async () => {
      // Arrange
      const mockTenantData = {
        name: "Test Tenant",
        bootstrap: {
          createDefaultRoles: true,
        },
      };

      const mockCreatedTenant = {
        tenantId: "tenant_12345-abc-6789",
        orgId: "org_123",
        name: "Test Tenant",
        status: TenantStatusEnum.ACTIVE,
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-01-01T00:00:00.000Z"),
      };

      mockRequest.params = { orgId: "org_123" };
      mockRequest.body = mockTenantData;
      mockTenantService.createTenant.mockResolvedValue(mockCreatedTenant);

      // Act
      await tenantController.createTenant(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockTenantService.createTenant).toHaveBeenCalledWith({
        orgId: "org_123",
        name: "Test Tenant",
      });

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        tenantId: "tenant_12345-abc-6789",
        orgId: "org_123",
        name: "Test Tenant",
        status: TenantStatusEnum.ACTIVE,
        createdAt: mockCreatedTenant.createdAt,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should trim whitespace from tenant name", async () => {
      // Arrange
      const mockTenantData = {
        name: "  Test Tenant  ",
      };

      const mockCreatedTenant = {
        tenantId: "tenant_12345",
        orgId: "org_123",
        name: "Test Tenant",
        status: TenantStatusEnum.ACTIVE,
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-01-01T00:00:00.000Z"),
      };

      mockRequest.params = { orgId: "org_123" };
      mockRequest.body = mockTenantData;
      mockTenantService.createTenant.mockResolvedValue(mockCreatedTenant);

      // Act
      await tenantController.createTenant(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockTenantService.createTenant).toHaveBeenCalledWith({
        orgId: "org_123",
        name: "Test Tenant",
      });

      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it("should throw error when orgId is missing", async () => {
      // Arrange
      mockRequest.params = {};
      mockRequest.body = { name: "Test Tenant" };

      // Act
      await tenantController.createTenant(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: "Organization ID is required",
        })
      );
      expect(mockTenantService.createTenant).not.toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should call next with error when service throws an error", async () => {
      // Arrange
      const mockTenantData = {
        name: "Test Tenant",
      };

      const serviceError = new Error("Tenant with this name already exists");

      mockRequest.params = { orgId: "org_123" };
      mockRequest.body = mockTenantData;
      mockTenantService.createTenant.mockRejectedValue(serviceError);

      // Act
      await tenantController.createTenant(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockTenantService.createTenant).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(serviceError);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it("should handle HttpError from service", async () => {
      // Arrange
      const mockTenantData = {
        name: "Test Tenant",
      };

      const httpError = new HttpError(404, "Organization not found");

      mockRequest.params = { orgId: "org_nonexistent" };
      mockRequest.body = mockTenantData;
      mockTenantService.createTenant.mockRejectedValue(httpError);

      // Act
      await tenantController.createTenant(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(httpError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should handle database errors", async () => {
      // Arrange
      const mockTenantData = {
        name: "Test Tenant",
      };

      const dbError = new Error("Database connection failed");

      mockRequest.params = { orgId: "org_123" };
      mockRequest.body = mockTenantData;
      mockTenantService.createTenant.mockRejectedValue(dbError);

      // Act
      await tenantController.createTenant(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(dbError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should create tenant with bootstrap options", async () => {
      // Arrange
      const mockTenantData = {
        name: "Production Tenant",
        bootstrap: {
          createDefaultRoles: true,
        },
      };

      const mockCreatedTenant = {
        tenantId: "tenant_prod_123",
        orgId: "org_123",
        name: "Production Tenant",
        status: TenantStatusEnum.ACTIVE,
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-01-01T00:00:00.000Z"),
      };

      mockRequest.params = { orgId: "org_123" };
      mockRequest.body = mockTenantData;
      mockTenantService.createTenant.mockResolvedValue(mockCreatedTenant);

      // Act
      await tenantController.createTenant(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockTenantService.createTenant).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: "tenant_prod_123",
          orgId: "org_123",
          name: "Production Tenant",
          status: TenantStatusEnum.ACTIVE,
        })
      );
    });

    it("should handle unexpected errors gracefully", async () => {
      // Arrange
      const mockTenantData = {
        name: "Test Tenant",
      };

      const unexpectedError = new Error("Unexpected error occurred");

      mockRequest.params = { orgId: "org_123" };
      mockRequest.body = mockTenantData;
      mockTenantService.createTenant.mockRejectedValue(unexpectedError);

      // Act
      await tenantController.createTenant(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe("deactivateTenant", () => {
    beforeEach(() => {
      mockTenantService.deactivateTenant = jest.fn();
    });

    it("should successfully deactivate a tenant and return 200 status", async () => {
      // Arrange
      const mockDeactivatedTenant = {
        tenantId: "tenant_12345-abc-6789",
        orgId: "org_123",
        name: "Test Tenant",
        status: TenantStatusEnum.DEACTIVATED,
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-01-02T00:00:00.000Z"),
        deactivatedAt: new Date("2023-01-02T00:00:00.000Z"),
      };

      mockRequest.params = { tenantId: "tenant_12345-abc-6789" };
      mockRequest.body = { reason: "Tenant no longer needed" };
      mockTenantService.deactivateTenant.mockResolvedValue(
        mockDeactivatedTenant
      );

      // Act
      await tenantController.deactivateTenant(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockTenantService.deactivateTenant).toHaveBeenCalledWith(
        "tenant_12345-abc-6789",
        { reason: "Tenant no longer needed" }
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        tenantId: "tenant_12345-abc-6789",
        status: TenantStatusEnum.DEACTIVATED,
        deactivatedAt: mockDeactivatedTenant.deactivatedAt,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should throw error when tenantId is missing", async () => {
      // Arrange
      mockRequest.params = {};
      mockRequest.body = { reason: "Test reason" };

      // Act
      await tenantController.deactivateTenant(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: "Tenant ID is required",
        })
      );
      expect(mockTenantService.deactivateTenant).not.toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should deactivate tenant without reason", async () => {
      // Arrange
      const mockDeactivatedTenant = {
        tenantId: "tenant_12345",
        orgId: "org_123",
        name: "Test Tenant",
        status: TenantStatusEnum.DEACTIVATED,
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-01-02T00:00:00.000Z"),
        deactivatedAt: new Date("2023-01-02T00:00:00.000Z"),
      };

      mockRequest.params = { tenantId: "tenant_12345" };
      mockRequest.body = {};
      mockTenantService.deactivateTenant.mockResolvedValue(
        mockDeactivatedTenant
      );

      // Act
      await tenantController.deactivateTenant(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockTenantService.deactivateTenant).toHaveBeenCalledWith(
        "tenant_12345",
        { reason: undefined }
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it("should call next with error when service throws an error", async () => {
      // Arrange
      const serviceError = new Error("Failed to deactivate tenant");

      mockRequest.params = { tenantId: "tenant_12345" };
      mockRequest.body = { reason: "Test reason" };
      mockTenantService.deactivateTenant.mockRejectedValue(serviceError);

      // Act
      await tenantController.deactivateTenant(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockTenantService.deactivateTenant).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(serviceError);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it("should handle HttpError when tenant not found", async () => {
      // Arrange
      const httpError = new HttpError(404, "Tenant not found");

      mockRequest.params = { tenantId: "tenant_nonexistent" };
      mockRequest.body = { reason: "Test reason" };
      mockTenantService.deactivateTenant.mockRejectedValue(httpError);

      // Act
      await tenantController.deactivateTenant(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(httpError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should handle database errors", async () => {
      // Arrange
      const dbError = new Error("Database connection failed");

      mockRequest.params = { tenantId: "tenant_12345" };
      mockRequest.body = { reason: "Test reason" };
      mockTenantService.deactivateTenant.mockRejectedValue(dbError);

      // Act
      await tenantController.deactivateTenant(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(dbError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should handle unexpected errors gracefully", async () => {
      // Arrange
      const unexpectedError = new Error("Unexpected error occurred");

      mockRequest.params = { tenantId: "tenant_12345" };
      mockRequest.body = { reason: "Test reason" };
      mockTenantService.deactivateTenant.mockRejectedValue(unexpectedError);

      // Act
      await tenantController.deactivateTenant(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(unexpectedError);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe("getTenant", () => {
    beforeEach(() => {
      mockTenantService.getTenant = jest.fn();
    });

    it("should successfully get tenant details and return 200 status", async () => {
      // Arrange
      const mockTenant = {
        tenantId: "tenant_12345-abc-6789",
        orgId: "org_123",
        name: "Test Tenant",
        status: TenantStatusEnum.ACTIVE,
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-01-01T00:00:00.000Z"),
      };

      mockRequest.params = { tenantId: "tenant_12345-abc-6789" };
      mockTenantService.getTenant.mockResolvedValue(mockTenant as any);

      // Act
      await tenantController.getTenant(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockTenantService.getTenant).toHaveBeenCalledWith(
        "tenant_12345-abc-6789"
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        tenantId: "tenant_12345-abc-6789",
        orgId: "org_123",
        name: "Test Tenant",
        status: TenantStatusEnum.ACTIVE,
        createdAt: mockTenant.createdAt,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should throw error when tenantId is missing", async () => {
      // Arrange
      mockRequest.params = {};

      // Act
      await tenantController.getTenant(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: "Tenant ID is required",
        })
      );
      expect(mockTenantService.getTenant).not.toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should handle HttpError when tenant not found", async () => {
      // Arrange
      const httpError = new HttpError(404, "Tenant not found");

      mockRequest.params = { tenantId: "tenant_nonexistent" };
      mockTenantService.getTenant.mockRejectedValue(httpError);

      // Act
      await tenantController.getTenant(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(httpError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should call next with error when service throws an error", async () => {
      // Arrange
      const serviceError = new Error("Failed to retrieve tenant");

      mockRequest.params = { tenantId: "tenant_12345" };
      mockTenantService.getTenant.mockRejectedValue(serviceError);

      // Act
      await tenantController.getTenant(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockTenantService.getTenant).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(serviceError);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });
  });

  describe("addUserToTenant", () => {
    beforeEach(() => {
      mockTenantService.addUserToTenant = jest.fn();
    });

    it("should successfully add user to tenant and return 201 status", async () => {
      // Arrange
      const mockMembership = {
        tenantId: "tenant_12345-abc-6789",
        userId: "user_98765",
        status: TenantMembershipStatusEnum.ACTIVE,
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
      };

      mockRequest.params = { tenantId: "tenant_12345-abc-6789" };
      mockRequest.body = { userId: "user_98765" };
      mockTenantService.addUserToTenant.mockResolvedValue(
        mockMembership as any
      );

      // Act
      await tenantController.addUserToTenant(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockTenantService.addUserToTenant).toHaveBeenCalledWith(
        "tenant_12345-abc-6789",
        { userId: "user_98765" }
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        tenantId: "tenant_12345-abc-6789",
        userId: "user_98765",
        status: TenantMembershipStatusEnum.ACTIVE,
        createdAt: mockMembership.createdAt,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should throw error when tenantId is missing", async () => {
      // Arrange
      mockRequest.params = {};
      mockRequest.body = { userId: "user_98765" };

      // Act
      await tenantController.addUserToTenant(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: "Tenant ID is required",
        })
      );
      expect(mockTenantService.addUserToTenant).not.toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should throw error when userId is missing", async () => {
      // Arrange
      mockRequest.params = { tenantId: "tenant_12345" };
      mockRequest.body = {};

      // Act
      await tenantController.addUserToTenant(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: "User ID is required",
        })
      );
      expect(mockTenantService.addUserToTenant).not.toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should handle HttpError when tenant not found", async () => {
      // Arrange
      const httpError = new HttpError(404, "Tenant not found");

      mockRequest.params = { tenantId: "tenant_nonexistent" };
      mockRequest.body = { userId: "user_98765" };
      mockTenantService.addUserToTenant.mockRejectedValue(httpError);

      // Act
      await tenantController.addUserToTenant(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(httpError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should call next with error when service throws an error", async () => {
      // Arrange
      const serviceError = new Error("User already member of tenant");

      mockRequest.params = { tenantId: "tenant_12345" };
      mockRequest.body = { userId: "user_98765" };
      mockTenantService.addUserToTenant.mockRejectedValue(serviceError);

      // Act
      await tenantController.addUserToTenant(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockTenantService.addUserToTenant).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(serviceError);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it("should handle database errors", async () => {
      // Arrange
      const dbError = new Error("Database connection failed");

      mockRequest.params = { tenantId: "tenant_12345" };
      mockRequest.body = { userId: "user_98765" };
      mockTenantService.addUserToTenant.mockRejectedValue(dbError);

      // Act
      await tenantController.addUserToTenant(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(dbError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});
