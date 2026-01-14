import "reflect-metadata";
import { Request, Response, NextFunction } from "express";
import { OrganizationController } from "../../../../src/domains/organization/controllers/organization.controller";
import { OrganizationService } from "../../../../src/domains/organization/services/organization.service";
import { HttpError } from "../../../../src/domains/common/errors/http.error";
import {
  OrganizationTypeEnum,
  OrganizationStatusEnum,
} from "../../../../src/types/config";

describe("OrganizationController", () => {
  let organizationController: OrganizationController;
  let mockOrganizationService: jest.Mocked<OrganizationService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Create mock service
    mockOrganizationService = {
      createOrganization: jest.fn(),
    } as any;

    // Create controller instance
    organizationController = new OrganizationController(
      mockOrganizationService
    );

    // Setup mock request, response, and next
    mockRequest = {
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

  describe("createOrganization", () => {
    it("should successfully create an organization and return 201 status", async () => {
      // Arrange
      const mockOrgData = {
        name: "Test Organization",
        type: OrganizationTypeEnum.DIRECT,
      };

      const mockCreatedOrg = {
        orgId: "org_12345-abc-6789",
        name: "Test Organization",
        type: OrganizationTypeEnum.DIRECT,
        status: OrganizationStatusEnum.ACTIVE,
        ownerUserId: "userId123",
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-01-01T00:00:00.000Z"),
      };

      mockRequest.body = mockOrgData;
      mockOrganizationService.createOrganization.mockResolvedValue(
        mockCreatedOrg as any
      );

      // Act
      await organizationController.createOrganization(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockOrganizationService.createOrganization).toHaveBeenCalledWith({
        name: "Test Organization",
        type: OrganizationTypeEnum.DIRECT,
        ownerUserId: "userId123",
      });

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        orgId: "org_12345-abc-6789",
        name: "Test Organization",
        type: OrganizationTypeEnum.DIRECT,
        status: OrganizationStatusEnum.ACTIVE,
        ownerUserId: "userId123",
        createdAt: mockCreatedOrg.createdAt,
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should trim whitespace from organization name", async () => {
      // Arrange
      const mockOrgData = {
        name: "  Test Organization  ",
        type: OrganizationTypeEnum.MSP,
      };

      const mockCreatedOrg = {
        orgId: "org_12345-abc-6789",
        name: "Test Organization",
        type: OrganizationTypeEnum.MSP,
        status: OrganizationStatusEnum.ACTIVE,
        ownerUserId: "userId123",
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-01-01T00:00:00.000Z"),
      };

      mockRequest.body = mockOrgData;
      mockOrganizationService.createOrganization.mockResolvedValue(
        mockCreatedOrg as any
      );

      // Act
      await organizationController.createOrganization(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockOrganizationService.createOrganization).toHaveBeenCalledWith({
        name: "Test Organization",
        type: OrganizationTypeEnum.MSP,
        ownerUserId: "userId123",
      });

      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it("should call next with error when service throws an error", async () => {
      // Arrange
      const mockOrgData = {
        name: "Test Organization",
        type: OrganizationTypeEnum.DIRECT,
      };

      const serviceError = new Error(
        "Organization with this name already exists"
      );

      mockRequest.body = mockOrgData;
      mockOrganizationService.createOrganization.mockRejectedValue(
        serviceError
      );

      // Act
      await organizationController.createOrganization(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockOrganizationService.createOrganization).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledWith(serviceError);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it("should handle database errors", async () => {
      // Arrange
      const mockOrgData = {
        name: "Test Organization",
        type: OrganizationTypeEnum.DIRECT,
      };

      const dbError = new Error("Database connection failed");

      mockRequest.body = mockOrgData;
      mockOrganizationService.createOrganization.mockRejectedValue(dbError);

      // Act
      await organizationController.createOrganization(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(dbError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should handle validation errors from service", async () => {
      // Arrange
      const mockOrgData = {
        name: "",
        type: OrganizationTypeEnum.DIRECT,
      };

      const validationError = new Error("Organization name is required");

      mockRequest.body = mockOrgData;
      mockOrganizationService.createOrganization.mockRejectedValue(
        validationError
      );

      // Act
      await organizationController.createOrganization(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(validationError);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should use hardcoded ownerUserId until auth is implemented", async () => {
      // Arrange
      const mockOrgData = {
        name: "Test Organization",
        type: OrganizationTypeEnum.DIRECT,
      };

      const mockCreatedOrg = {
        orgId: "org_12345",
        name: "Test Organization",
        type: OrganizationTypeEnum.DIRECT,
        status: OrganizationStatusEnum.ACTIVE,
        ownerUserId: "userId123",
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-01-01T00:00:00.000Z"),
      };

      mockRequest.body = mockOrgData;
      mockOrganizationService.createOrganization.mockResolvedValue(
        mockCreatedOrg as any
      );

      // Act
      await organizationController.createOrganization(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Assert
      expect(mockOrganizationService.createOrganization).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerUserId: "userId123",
        })
      );
    });

    it("should handle unexpected errors gracefully", async () => {
      // Arrange
      const mockOrgData = {
        name: "Test Organization",
        type: OrganizationTypeEnum.DIRECT,
      };

      const unexpectedError = new Error("Unexpected error occurred");

      mockRequest.body = mockOrgData;
      mockOrganizationService.createOrganization.mockRejectedValue(
        unexpectedError
      );

      // Act
      await organizationController.createOrganization(
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
});
