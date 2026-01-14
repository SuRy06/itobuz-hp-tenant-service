import "reflect-metadata";
import { TenantService } from "../../../../src/domains/organization/services/tenant.service";
import { TenantRepository } from "../../../../src/domains/organization/repositories/tenant.repository";
import { OrganizationRepository } from "../../../../src/domains/organization/repositories/organization.repository";
import { TenantMembershipRepository } from "../../../../src/domains/organization/repositories/tenantMembership.repository";
import {
  TenantStatusEnum,
  OrganizationStatusEnum,
  OrganizationTypeEnum,
  TenantMembershipStatusEnum,
} from "../../../../src/types/config";
import { CreateTenantDTO } from "../../../../src/domains/organization/interfaces/tenant.interface";
import { AddUserToTenantDTO } from "../../../../src/domains/organization/interfaces/tenantMembership.interface";
import { HttpError } from "../../../../src/domains/common/errors/http.error";

// Mock uuid
jest.mock("uuid");

describe("TenantService", () => {
  let tenantService: TenantService;
  let mockTenantRepository: jest.Mocked<TenantRepository>;
  let mockOrganizationRepository: jest.Mocked<OrganizationRepository>;
  let mockTenantMembershipRepository: jest.Mocked<TenantMembershipRepository>;

  beforeEach(() => {
    // Mock uuid implementation
    const { v4: uuid4 } = require("uuid");
    (uuid4 as jest.Mock).mockReturnValue("mocked-uuid-1234");

    // Create mock repositories
    mockTenantRepository = {
      create: jest.fn(),
    } as any;

    mockOrganizationRepository = {
      findById: jest.fn(),
    } as any;

    mockTenantMembershipRepository = {
      create: jest.fn(),
      findByTenantAndUser: jest.fn(),
      update: jest.fn(),
    } as any;

    // Create service instance
    tenantService = new TenantService(
      mockTenantRepository,
      mockOrganizationRepository,
      mockTenantMembershipRepository
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createTenant", () => {
    it("should successfully create a tenant with valid organization", async () => {
      // Arrange
      const createDTO: CreateTenantDTO = {
        orgId: "org_123",
        name: "Test Tenant",
      };

      const mockOrganization = {
        orgId: "org_123",
        name: "Test Organization",
        type: OrganizationTypeEnum.DIRECT,
        status: OrganizationStatusEnum.ACTIVE,
        ownerUserId: "user123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedTenant = {
        tenantId: "mocked-uuid-1234",
        orgId: "org_123",
        name: "Test Tenant",
        status: TenantStatusEnum.ACTIVE,
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-01-01T00:00:00.000Z"),
      };

      mockOrganizationRepository.findById.mockResolvedValue(
        mockOrganization as any
      );
      mockTenantRepository.create.mockResolvedValue(expectedTenant as any);

      // Act
      const result = await tenantService.createTenant(createDTO);

      // Assert
      expect(mockOrganizationRepository.findById).toHaveBeenCalledWith(
        "org_123"
      );
      expect(mockTenantRepository.create).toHaveBeenCalledWith({
        tenantId: "mocked-uuid-1234",
        orgId: "org_123",
        name: "Test Tenant",
        status: TenantStatusEnum.ACTIVE,
      });
      expect(result).toEqual(expectedTenant);
    });

    it("should throw 404 error when organization does not exist", async () => {
      // Arrange
      const createDTO: CreateTenantDTO = {
        orgId: "org_nonexistent",
        name: "Test Tenant",
      };

      mockOrganizationRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(tenantService.createTenant(createDTO)).rejects.toThrow(
        new HttpError(404, "Organization not found")
      );

      expect(mockOrganizationRepository.findById).toHaveBeenCalledWith(
        "org_nonexistent"
      );
      expect(mockTenantRepository.create).not.toHaveBeenCalled();
    });

    it("should throw 400 error when organization is not ACTIVE", async () => {
      // Arrange
      const createDTO: CreateTenantDTO = {
        orgId: "org_123",
        name: "Test Tenant",
      };

      const mockOrganization = {
        orgId: "org_123",
        name: "Test Organization",
        type: OrganizationTypeEnum.DIRECT,
        status: OrganizationStatusEnum.SUSPENDED,
        ownerUserId: "user123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOrganizationRepository.findById.mockResolvedValue(
        mockOrganization as any
      );

      // Act & Assert
      await expect(tenantService.createTenant(createDTO)).rejects.toThrow(
        new HttpError(400, "Organization must be ACTIVE to create tenants")
      );

      expect(mockOrganizationRepository.findById).toHaveBeenCalledWith(
        "org_123"
      );
      expect(mockTenantRepository.create).not.toHaveBeenCalled();
    });

    it("should throw 400 error when organization is DEACTIVATED", async () => {
      // Arrange
      const createDTO: CreateTenantDTO = {
        orgId: "org_123",
        name: "Test Tenant",
      };

      const mockOrganization = {
        orgId: "org_123",
        name: "Test Organization",
        type: OrganizationTypeEnum.DIRECT,
        status: OrganizationStatusEnum.DEACTIVATED,
        ownerUserId: "user123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOrganizationRepository.findById.mockResolvedValue(
        mockOrganization as any
      );

      // Act & Assert
      await expect(tenantService.createTenant(createDTO)).rejects.toThrow(
        new HttpError(400, "Organization must be ACTIVE to create tenants")
      );
    });

    it("should set status to ACTIVE by default", async () => {
      // Arrange
      const createDTO: CreateTenantDTO = {
        orgId: "org_123",
        name: "Test Tenant",
      };

      const mockOrganization = {
        orgId: "org_123",
        name: "Test Organization",
        type: OrganizationTypeEnum.DIRECT,
        status: OrganizationStatusEnum.ACTIVE,
        ownerUserId: "user123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedTenant = {
        tenantId: "mocked-uuid-1234",
        orgId: "org_123",
        name: "Test Tenant",
        status: TenantStatusEnum.ACTIVE,
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-01-01T00:00:00.000Z"),
      };

      mockOrganizationRepository.findById.mockResolvedValue(
        mockOrganization as any
      );
      mockTenantRepository.create.mockResolvedValue(expectedTenant as any);

      // Act
      const result = await tenantService.createTenant(createDTO);

      // Assert
      expect(mockTenantRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: TenantStatusEnum.ACTIVE,
        })
      );
      expect(result.status).toBe(TenantStatusEnum.ACTIVE);
    });

    it("should handle database errors from tenant repository", async () => {
      // Arrange
      const createDTO: CreateTenantDTO = {
        orgId: "org_123",
        name: "Test Tenant",
      };

      const mockOrganization = {
        orgId: "org_123",
        name: "Test Organization",
        type: OrganizationTypeEnum.DIRECT,
        status: OrganizationStatusEnum.ACTIVE,
        ownerUserId: "user123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const dbError = new Error("Database connection failed");

      mockOrganizationRepository.findById.mockResolvedValue(
        mockOrganization as any
      );
      mockTenantRepository.create.mockRejectedValue(dbError);

      // Act & Assert
      await expect(tenantService.createTenant(createDTO)).rejects.toThrow(
        "Database connection failed"
      );
    });

    it("should pass all required fields to repository", async () => {
      // Arrange
      const createDTO: CreateTenantDTO = {
        orgId: "org_456",
        name: "Complete Tenant",
      };

      const mockOrganization = {
        orgId: "org_456",
        name: "Test Organization",
        type: OrganizationTypeEnum.MSP,
        status: OrganizationStatusEnum.ACTIVE,
        ownerUserId: "user456",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const expectedTenant = {
        tenantId: "mocked-uuid-1234",
        orgId: "org_456",
        name: "Complete Tenant",
        status: TenantStatusEnum.ACTIVE,
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-01-01T00:00:00.000Z"),
      };

      mockOrganizationRepository.findById.mockResolvedValue(
        mockOrganization as any
      );
      mockTenantRepository.create.mockResolvedValue(expectedTenant as any);

      // Act
      await tenantService.createTenant(createDTO);

      // Assert
      expect(mockTenantRepository.create).toHaveBeenCalledWith({
        tenantId: "mocked-uuid-1234",
        orgId: "org_456",
        name: "Complete Tenant",
        status: TenantStatusEnum.ACTIVE,
      });
    });

    it("should handle network errors", async () => {
      // Arrange
      const createDTO: CreateTenantDTO = {
        orgId: "org_123",
        name: "Test Tenant",
      };

      const networkError = new Error("Network error");

      mockOrganizationRepository.findById.mockRejectedValue(networkError);

      // Act & Assert
      await expect(tenantService.createTenant(createDTO)).rejects.toThrow(
        "Network error"
      );
    });
  });

  describe("deactivateTenant", () => {
    beforeEach(() => {
      mockTenantRepository.findById = jest.fn();
      mockTenantRepository.update = jest.fn();
    });

    it("should successfully deactivate an active tenant", async () => {
      // Arrange
      const tenantId = "tenant_123";
      const deactivateDTO = {};

      const mockTenant = {
        tenantId: "tenant_123",
        orgId: "org_123",
        name: "Test Tenant",
        status: TenantStatusEnum.ACTIVE,
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-01-01T00:00:00.000Z"),
      };

      const updatedTenant = {
        ...mockTenant,
        status: TenantStatusEnum.DEACTIVATED,
        updatedAt: new Date("2023-01-02T00:00:00.000Z"),
      };

      mockTenantRepository.findById.mockResolvedValue(mockTenant as any);
      mockTenantRepository.update.mockResolvedValue(updatedTenant as any);

      // Act
      const result = await tenantService.deactivateTenant(
        tenantId,
        deactivateDTO
      );

      // Assert
      expect(mockTenantRepository.findById).toHaveBeenCalledWith("tenant_123");
      expect(mockTenantRepository.update).toHaveBeenCalledWith("tenant_123", {
        status: TenantStatusEnum.DEACTIVATED,
        updatedAt: expect.any(Date),
      });
      expect(result.status).toBe(TenantStatusEnum.DEACTIVATED);
    });

    it("should throw 404 error when tenant does not exist", async () => {
      // Arrange
      const tenantId = "tenant_nonexistent";
      const deactivateDTO = {};

      mockTenantRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        tenantService.deactivateTenant(tenantId, deactivateDTO)
      ).rejects.toThrow(new HttpError(404, "Tenant not found"));

      expect(mockTenantRepository.findById).toHaveBeenCalledWith(tenantId);
      expect(mockTenantRepository.update).not.toHaveBeenCalled();
    });

    it("should throw 400 error when tenant is already deactivated", async () => {
      // Arrange
      const tenantId = "tenant_123";
      const deactivateDTO = {};

      const mockTenant = {
        tenantId: "tenant_123",
        orgId: "org_123",
        name: "Test Tenant",
        status: TenantStatusEnum.DEACTIVATED,
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-01-01T00:00:00.000Z"),
      };

      mockTenantRepository.findById.mockResolvedValue(mockTenant as any);

      // Act & Assert
      await expect(
        tenantService.deactivateTenant(tenantId, deactivateDTO)
      ).rejects.toThrow(new HttpError(400, "Tenant is already deactivated"));

      expect(mockTenantRepository.findById).toHaveBeenCalledWith(tenantId);
      expect(mockTenantRepository.update).not.toHaveBeenCalled();
    });

    it("should throw 500 error when update fails", async () => {
      // Arrange
      const tenantId = "tenant_123";
      const deactivateDTO = {};

      const mockTenant = {
        tenantId: "tenant_123",
        orgId: "org_123",
        name: "Test Tenant",
        status: TenantStatusEnum.ACTIVE,
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-01-01T00:00:00.000Z"),
      };

      mockTenantRepository.findById.mockResolvedValue(mockTenant as any);
      mockTenantRepository.update.mockResolvedValue(null);

      // Act & Assert
      await expect(
        tenantService.deactivateTenant(tenantId, deactivateDTO)
      ).rejects.toThrow(new HttpError(500, "Failed to deactivate tenant"));

      expect(mockTenantRepository.update).toHaveBeenCalledWith(tenantId, {
        status: TenantStatusEnum.DEACTIVATED,
        updatedAt: expect.any(Date),
      });
    });

    it("should handle database errors from tenant repository", async () => {
      // Arrange
      const tenantId = "tenant_123";
      const deactivateDTO = {};

      const dbError = new Error("Database connection failed");

      mockTenantRepository.findById.mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        tenantService.deactivateTenant(tenantId, deactivateDTO)
      ).rejects.toThrow("Database connection failed");
    });

    it("should update the updatedAt timestamp", async () => {
      // Arrange
      const tenantId = "tenant_123";
      const deactivateDTO = {};

      const mockTenant = {
        tenantId: "tenant_123",
        orgId: "org_123",
        name: "Test Tenant",
        status: TenantStatusEnum.ACTIVE,
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-01-01T00:00:00.000Z"),
      };

      const updatedTenant = {
        ...mockTenant,
        status: TenantStatusEnum.DEACTIVATED,
        updatedAt: new Date("2023-01-02T00:00:00.000Z"),
      };

      mockTenantRepository.findById.mockResolvedValue(mockTenant as any);
      mockTenantRepository.update.mockResolvedValue(updatedTenant as any);

      // Act
      await tenantService.deactivateTenant(tenantId, deactivateDTO);

      // Assert
      expect(mockTenantRepository.update).toHaveBeenCalledWith(
        tenantId,
        expect.objectContaining({
          updatedAt: expect.any(Date),
        })
      );
    });

    it("should deactivate suspended tenant", async () => {
      // Arrange
      const tenantId = "tenant_123";
      const deactivateDTO = {};

      const mockTenant = {
        tenantId: "tenant_123",
        orgId: "org_123",
        name: "Test Tenant",
        status: TenantStatusEnum.SUSPENDED,
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-01-01T00:00:00.000Z"),
      };

      const updatedTenant = {
        ...mockTenant,
        status: TenantStatusEnum.DEACTIVATED,
        updatedAt: new Date("2023-01-02T00:00:00.000Z"),
      };

      mockTenantRepository.findById.mockResolvedValue(mockTenant as any);
      mockTenantRepository.update.mockResolvedValue(updatedTenant as any);

      // Act
      const result = await tenantService.deactivateTenant(
        tenantId,
        deactivateDTO
      );

      // Assert
      expect(result.status).toBe(TenantStatusEnum.DEACTIVATED);
      expect(mockTenantRepository.update).toHaveBeenCalled();
    });
  });

  describe("getTenant", () => {
    beforeEach(() => {
      mockTenantRepository.findById = jest.fn();
    });

    it("should successfully retrieve a tenant by id", async () => {
      // Arrange
      const tenantId = "tenant_123";

      const mockTenant = {
        tenantId: "tenant_123",
        orgId: "org_123",
        name: "Test Tenant",
        status: TenantStatusEnum.ACTIVE,
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-01-01T00:00:00.000Z"),
      };

      mockTenantRepository.findById.mockResolvedValue(mockTenant as any);

      // Act
      const result = await tenantService.getTenant(tenantId);

      // Assert
      expect(mockTenantRepository.findById).toHaveBeenCalledWith("tenant_123");
      expect(result).toEqual(mockTenant);
    });

    it("should throw 404 error when tenant does not exist", async () => {
      // Arrange
      const tenantId = "tenant_nonexistent";

      mockTenantRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(tenantService.getTenant(tenantId)).rejects.toThrow(
        new HttpError(404, "Tenant not found")
      );

      expect(mockTenantRepository.findById).toHaveBeenCalledWith(tenantId);
    });

    it("should retrieve tenant with ACTIVE status", async () => {
      // Arrange
      const tenantId = "tenant_123";

      const mockTenant = {
        tenantId: "tenant_123",
        orgId: "org_123",
        name: "Active Tenant",
        status: TenantStatusEnum.ACTIVE,
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-01-01T00:00:00.000Z"),
      };

      mockTenantRepository.findById.mockResolvedValue(mockTenant as any);

      // Act
      const result = await tenantService.getTenant(tenantId);

      // Assert
      expect(result.status).toBe(TenantStatusEnum.ACTIVE);
    });

    it("should retrieve tenant with SUSPENDED status", async () => {
      // Arrange
      const tenantId = "tenant_123";

      const mockTenant = {
        tenantId: "tenant_123",
        orgId: "org_123",
        name: "Suspended Tenant",
        status: TenantStatusEnum.SUSPENDED,
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-01-01T00:00:00.000Z"),
      };

      mockTenantRepository.findById.mockResolvedValue(mockTenant as any);

      // Act
      const result = await tenantService.getTenant(tenantId);

      // Assert
      expect(result.status).toBe(TenantStatusEnum.SUSPENDED);
    });

    it("should retrieve tenant with DEACTIVATED status", async () => {
      // Arrange
      const tenantId = "tenant_123";

      const mockTenant = {
        tenantId: "tenant_123",
        orgId: "org_123",
        name: "Deactivated Tenant",
        status: TenantStatusEnum.DEACTIVATED,
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-01-01T00:00:00.000Z"),
      };

      mockTenantRepository.findById.mockResolvedValue(mockTenant as any);

      // Act
      const result = await tenantService.getTenant(tenantId);

      // Assert
      expect(result.status).toBe(TenantStatusEnum.DEACTIVATED);
    });

    it("should handle database errors from tenant repository", async () => {
      // Arrange
      const tenantId = "tenant_123";
      const dbError = new Error("Database connection failed");

      mockTenantRepository.findById.mockRejectedValue(dbError);

      // Act & Assert
      await expect(tenantService.getTenant(tenantId)).rejects.toThrow(
        "Database connection failed"
      );
    });

    it("should return tenant with all required fields", async () => {
      // Arrange
      const tenantId = "tenant_123";

      const mockTenant = {
        tenantId: "tenant_123",
        orgId: "org_456",
        name: "Complete Tenant",
        status: TenantStatusEnum.ACTIVE,
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-01-02T00:00:00.000Z"),
      };

      mockTenantRepository.findById.mockResolvedValue(mockTenant as any);

      // Act
      const result = await tenantService.getTenant(tenantId);

      // Assert
      expect(result).toHaveProperty("tenantId");
      expect(result).toHaveProperty("orgId");
      expect(result).toHaveProperty("name");
      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("createdAt");
      expect(result).toHaveProperty("updatedAt");
    });

    it("should handle network errors", async () => {
      // Arrange
      const tenantId = "tenant_123";
      const networkError = new Error("Network error");

      mockTenantRepository.findById.mockRejectedValue(networkError);

      // Act & Assert
      await expect(tenantService.getTenant(tenantId)).rejects.toThrow(
        "Network error"
      );
    });
  });

  describe("addUserToTenant", () => {
    beforeEach(() => {
      mockTenantRepository.findById = jest.fn();
      mockOrganizationRepository.findById = jest.fn();
      mockTenantMembershipRepository.findByTenantAndUser = jest.fn();
      mockTenantMembershipRepository.create = jest.fn();
      mockTenantMembershipRepository.update = jest.fn();
    });

    it("should successfully add a new user to an active tenant", async () => {
      // Arrange
      const tenantId = "tenant_123";
      const addUserDTO: AddUserToTenantDTO = {
        userId: "user_456",
      };

      const mockTenant = {
        tenantId: "tenant_123",
        orgId: "org_123",
        name: "Test Tenant",
        status: TenantStatusEnum.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockOrganization = {
        orgId: "org_123",
        name: "Test Organization",
        type: OrganizationTypeEnum.DIRECT,
        status: OrganizationStatusEnum.ACTIVE,
        ownerUserId: "user123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockMembership = {
        tenantId: "tenant_123",
        userId: "user_456",
        status: TenantMembershipStatusEnum.ACTIVE,
        createdAt: new Date(),
      };

      mockTenantRepository.findById.mockResolvedValue(mockTenant as any);
      mockOrganizationRepository.findById.mockResolvedValue(
        mockOrganization as any
      );
      mockTenantMembershipRepository.findByTenantAndUser.mockResolvedValue(
        null
      );
      mockTenantMembershipRepository.create.mockResolvedValue(
        mockMembership as any
      );

      // Act
      const result = await tenantService.addUserToTenant(tenantId, addUserDTO);

      // Assert
      expect(mockTenantRepository.findById).toHaveBeenCalledWith(tenantId);
      expect(mockOrganizationRepository.findById).toHaveBeenCalledWith(
        "org_123"
      );
      expect(
        mockTenantMembershipRepository.findByTenantAndUser
      ).toHaveBeenCalledWith(tenantId, addUserDTO.userId);
      expect(mockTenantMembershipRepository.create).toHaveBeenCalledWith({
        tenantId: tenantId,
        userId: addUserDTO.userId,
        status: TenantMembershipStatusEnum.ACTIVE,
      });
      expect(result).toEqual(mockMembership);
    });

    it("should throw 404 error when tenant does not exist", async () => {
      // Arrange
      const tenantId = "tenant_nonexistent";
      const addUserDTO: AddUserToTenantDTO = {
        userId: "user_456",
      };

      mockTenantRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        tenantService.addUserToTenant(tenantId, addUserDTO)
      ).rejects.toThrow(new HttpError(404, "Tenant not found"));

      expect(mockTenantRepository.findById).toHaveBeenCalledWith(tenantId);
      expect(mockOrganizationRepository.findById).not.toHaveBeenCalled();
      expect(mockTenantMembershipRepository.create).not.toHaveBeenCalled();
    });

    it("should throw 400 error when tenant is not ACTIVE", async () => {
      // Arrange
      const tenantId = "tenant_123";
      const addUserDTO: AddUserToTenantDTO = {
        userId: "user_456",
      };

      const mockTenant = {
        tenantId: "tenant_123",
        orgId: "org_123",
        name: "Test Tenant",
        status: TenantStatusEnum.SUSPENDED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTenantRepository.findById.mockResolvedValue(mockTenant as any);

      // Act & Assert
      await expect(
        tenantService.addUserToTenant(tenantId, addUserDTO)
      ).rejects.toThrow(
        new HttpError(400, "Tenant must be ACTIVE to add users")
      );

      expect(mockTenantRepository.findById).toHaveBeenCalledWith(tenantId);
      expect(mockOrganizationRepository.findById).not.toHaveBeenCalled();
    });

    it("should throw 404 error when organization does not exist", async () => {
      // Arrange
      const tenantId = "tenant_123";
      const addUserDTO: AddUserToTenantDTO = {
        userId: "user_456",
      };

      const mockTenant = {
        tenantId: "tenant_123",
        orgId: "org_nonexistent",
        name: "Test Tenant",
        status: TenantStatusEnum.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTenantRepository.findById.mockResolvedValue(mockTenant as any);
      mockOrganizationRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        tenantService.addUserToTenant(tenantId, addUserDTO)
      ).rejects.toThrow(new HttpError(404, "Organization not found"));

      expect(mockOrganizationRepository.findById).toHaveBeenCalledWith(
        "org_nonexistent"
      );
      expect(mockTenantMembershipRepository.create).not.toHaveBeenCalled();
    });

    it("should throw 400 error when organization is not ACTIVE", async () => {
      // Arrange
      const tenantId = "tenant_123";
      const addUserDTO: AddUserToTenantDTO = {
        userId: "user_456",
      };

      const mockTenant = {
        tenantId: "tenant_123",
        orgId: "org_123",
        name: "Test Tenant",
        status: TenantStatusEnum.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockOrganization = {
        orgId: "org_123",
        name: "Test Organization",
        type: OrganizationTypeEnum.DIRECT,
        status: OrganizationStatusEnum.DEACTIVATED,
        ownerUserId: "user123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTenantRepository.findById.mockResolvedValue(mockTenant as any);
      mockOrganizationRepository.findById.mockResolvedValue(
        mockOrganization as any
      );

      // Act & Assert
      await expect(
        tenantService.addUserToTenant(tenantId, addUserDTO)
      ).rejects.toThrow(new HttpError(400, "Organization must be ACTIVE"));

      expect(mockOrganizationRepository.findById).toHaveBeenCalledWith(
        "org_123"
      );
      expect(mockTenantMembershipRepository.create).not.toHaveBeenCalled();
    });

    it("should transition INVITED membership to ACTIVE", async () => {
      // Arrange
      const tenantId = "tenant_123";
      const addUserDTO: AddUserToTenantDTO = {
        userId: "user_456",
      };

      const mockTenant = {
        tenantId: "tenant_123",
        orgId: "org_123",
        name: "Test Tenant",
        status: TenantStatusEnum.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockOrganization = {
        orgId: "org_123",
        name: "Test Organization",
        type: OrganizationTypeEnum.DIRECT,
        status: OrganizationStatusEnum.ACTIVE,
        ownerUserId: "user123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const existingMembership = {
        tenantId: "tenant_123",
        userId: "user_456",
        status: TenantMembershipStatusEnum.INVITED,
        createdAt: new Date(),
      };

      const updatedMembership = {
        ...existingMembership,
        status: TenantMembershipStatusEnum.ACTIVE,
      };

      mockTenantRepository.findById.mockResolvedValue(mockTenant as any);
      mockOrganizationRepository.findById.mockResolvedValue(
        mockOrganization as any
      );
      mockTenantMembershipRepository.findByTenantAndUser.mockResolvedValue(
        existingMembership as any
      );
      mockTenantMembershipRepository.update.mockResolvedValue(
        updatedMembership as any
      );

      // Act
      const result = await tenantService.addUserToTenant(tenantId, addUserDTO);

      // Assert
      expect(
        mockTenantMembershipRepository.findByTenantAndUser
      ).toHaveBeenCalledWith(tenantId, addUserDTO.userId);
      expect(mockTenantMembershipRepository.update).toHaveBeenCalledWith(
        tenantId,
        addUserDTO.userId,
        { status: TenantMembershipStatusEnum.ACTIVE }
      );
      expect(mockTenantMembershipRepository.create).not.toHaveBeenCalled();
      expect(result.status).toBe(TenantMembershipStatusEnum.ACTIVE);
    });

    it("should throw 409 error when user already has ACTIVE membership", async () => {
      // Arrange
      const tenantId = "tenant_123";
      const addUserDTO: AddUserToTenantDTO = {
        userId: "user_456",
      };

      const mockTenant = {
        tenantId: "tenant_123",
        orgId: "org_123",
        name: "Test Tenant",
        status: TenantStatusEnum.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockOrganization = {
        orgId: "org_123",
        name: "Test Organization",
        type: OrganizationTypeEnum.DIRECT,
        status: OrganizationStatusEnum.ACTIVE,
        ownerUserId: "user123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const existingMembership = {
        tenantId: "tenant_123",
        userId: "user_456",
        status: TenantMembershipStatusEnum.ACTIVE,
        createdAt: new Date(),
      };

      mockTenantRepository.findById.mockResolvedValue(mockTenant as any);
      mockOrganizationRepository.findById.mockResolvedValue(
        mockOrganization as any
      );
      mockTenantMembershipRepository.findByTenantAndUser.mockResolvedValue(
        existingMembership as any
      );

      // Act & Assert
      await expect(
        tenantService.addUserToTenant(tenantId, addUserDTO)
      ).rejects.toThrow(
        new HttpError(409, "User already has ACTIVE membership in this tenant")
      );

      expect(
        mockTenantMembershipRepository.findByTenantAndUser
      ).toHaveBeenCalledWith(tenantId, addUserDTO.userId);
      expect(mockTenantMembershipRepository.update).not.toHaveBeenCalled();
      expect(mockTenantMembershipRepository.create).not.toHaveBeenCalled();
    });

    it("should throw 500 error when membership update fails", async () => {
      // Arrange
      const tenantId = "tenant_123";
      const addUserDTO: AddUserToTenantDTO = {
        userId: "user_456",
      };

      const mockTenant = {
        tenantId: "tenant_123",
        orgId: "org_123",
        name: "Test Tenant",
        status: TenantStatusEnum.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockOrganization = {
        orgId: "org_123",
        name: "Test Organization",
        type: OrganizationTypeEnum.DIRECT,
        status: OrganizationStatusEnum.ACTIVE,
        ownerUserId: "user123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const existingMembership = {
        tenantId: "tenant_123",
        userId: "user_456",
        status: TenantMembershipStatusEnum.INVITED,
        createdAt: new Date(),
      };

      mockTenantRepository.findById.mockResolvedValue(mockTenant as any);
      mockOrganizationRepository.findById.mockResolvedValue(
        mockOrganization as any
      );
      mockTenantMembershipRepository.findByTenantAndUser.mockResolvedValue(
        existingMembership as any
      );
      mockTenantMembershipRepository.update.mockResolvedValue(null);

      // Act & Assert
      await expect(
        tenantService.addUserToTenant(tenantId, addUserDTO)
      ).rejects.toThrow(
        new HttpError(500, "Failed to update membership status")
      );
    });
  });
});
