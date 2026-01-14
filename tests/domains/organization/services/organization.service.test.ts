import "reflect-metadata";
import { OrganizationService } from "../../../../src/domains/organization/services/organization.service";
import { OrganizationRepository } from "../../../../src/domains/organization/repositories/organization.repository";
import { OrganizationMembershipRepository } from "../../../../src/domains/organization/repositories/organizationMembership.repository";
import {
  OrganizationTypeEnum,
  OrganizationStatusEnum,
  OrganizationMembershipRoleEnum,
  OrganizationMembershipStatusEnum,
} from "../../../../src/types/config";
import { CreateOrganizationDTO } from "../../../../src/domains/organization/interfaces/organization.interface";
import { ConflictError } from "../../../../src/domains/common/errors/conflict-error";
import { NotFoundError } from "../../../../src/domains/common/errors/not-found-error";
import { v4 as uuid4 } from "uuid";

// Mock uuid
jest.mock("uuid");

describe("OrganizationService", () => {
  let organizationService: OrganizationService;
  let mockOrganizationRepository: jest.Mocked<OrganizationRepository>;
  let mockOrganizationMembershipRepository: jest.Mocked<OrganizationMembershipRepository>;

  beforeEach(() => {
    // Mock uuid implementation
    (uuid4 as jest.Mock).mockReturnValue("mocked-uuid-1234");

    // Create mock repository
    mockOrganizationRepository = {
      create: jest.fn(),
      findById: jest.fn(),
    } as any;

    mockOrganizationMembershipRepository = {
      create: jest.fn(),
      findByOrgAndUser: jest.fn(),
      findByOrg: jest.fn(),
    } as any;

    // Create service instance
    organizationService = new OrganizationService(
      mockOrganizationRepository,
      mockOrganizationMembershipRepository
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createOrganization", () => {
    it("should successfully create an organization with generated orgId", async () => {
      // Arrange
      const createDTO: CreateOrganizationDTO = {
        name: "Test Organization",
        type: OrganizationTypeEnum.DIRECT,
        ownerUserId: "user123",
      };

      const expectedOrg = {
        orgId: "mocked-uuid-1234",
        name: "Test Organization",
        type: OrganizationTypeEnum.DIRECT,
        status: OrganizationStatusEnum.ACTIVE,
        ownerUserId: "user123",
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-01-01T00:00:00.000Z"),
      };

      mockOrganizationRepository.create.mockResolvedValue(expectedOrg as any);

      // Act
      const result = await organizationService.createOrganization(createDTO);

      // Assert
      expect(mockOrganizationRepository.create).toHaveBeenCalledWith({
        orgId: "mocked-uuid-1234",
        name: "Test Organization",
        type: OrganizationTypeEnum.DIRECT,
        status: OrganizationStatusEnum.ACTIVE,
        ownerUserId: "user123",
      });
      expect(result).toEqual(expectedOrg);
    });

    it("should create organization with MSP type", async () => {
      // Arrange
      const createDTO: CreateOrganizationDTO = {
        name: "MSP Organization",
        type: OrganizationTypeEnum.MSP,
        ownerUserId: "user456",
      };

      const expectedOrg = {
        orgId: "mocked-uuid-1234",
        name: "MSP Organization",
        type: OrganizationTypeEnum.MSP,
        status: OrganizationStatusEnum.ACTIVE,
        ownerUserId: "user456",
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-01-01T00:00:00.000Z"),
      };

      mockOrganizationRepository.create.mockResolvedValue(expectedOrg as any);

      // Act
      const result = await organizationService.createOrganization(createDTO);

      // Assert
      expect(result.type).toBe(OrganizationTypeEnum.MSP);
      expect(result.name).toBe("MSP Organization");
    });

    it("should create organization with INTERNAL type", async () => {
      // Arrange
      const createDTO: CreateOrganizationDTO = {
        name: "Internal Organization",
        type: OrganizationTypeEnum.INTERNAL,
        ownerUserId: "user789",
      };

      const expectedOrg = {
        orgId: "mocked-uuid-1234",
        name: "Internal Organization",
        type: OrganizationTypeEnum.INTERNAL,
        status: OrganizationStatusEnum.ACTIVE,
        ownerUserId: "user789",
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-01-01T00:00:00.000Z"),
      };

      mockOrganizationRepository.create.mockResolvedValue(expectedOrg as any);

      // Act
      const result = await organizationService.createOrganization(createDTO);

      // Assert
      expect(result.type).toBe(OrganizationTypeEnum.INTERNAL);
      expect(result.name).toBe("Internal Organization");
    });

    it("should set status to ACTIVE by default", async () => {
      // Arrange
      const createDTO: CreateOrganizationDTO = {
        name: "Test Organization",
        type: OrganizationTypeEnum.DIRECT,
        ownerUserId: "user123",
      };

      const expectedOrg = {
        orgId: "mocked-uuid-1234",
        name: "Test Organization",
        type: OrganizationTypeEnum.DIRECT,
        status: OrganizationStatusEnum.ACTIVE,
        ownerUserId: "user123",
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-01-01T00:00:00.000Z"),
      };

      mockOrganizationRepository.create.mockResolvedValue(expectedOrg as any);

      // Act
      const result = await organizationService.createOrganization(createDTO);

      // Assert
      expect(mockOrganizationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrganizationStatusEnum.ACTIVE,
        })
      );
      expect(result.status).toBe(OrganizationStatusEnum.ACTIVE);
    });

    it("should throw error when organization name already exists (duplicate error code 11000)", async () => {
      // Arrange
      const createDTO: CreateOrganizationDTO = {
        name: "Duplicate Organization",
        type: OrganizationTypeEnum.DIRECT,
        ownerUserId: "user123",
      };

      const duplicateError: any = new Error("Duplicate key error");
      duplicateError.code = 11000;

      mockOrganizationRepository.create.mockRejectedValue(duplicateError);

      // Act & Assert
      await expect(
        organizationService.createOrganization(createDTO)
      ).rejects.toThrow("Organization with this name already exists");
    });

    it("should rethrow other database errors", async () => {
      // Arrange
      const createDTO: CreateOrganizationDTO = {
        name: "Test Organization",
        type: OrganizationTypeEnum.DIRECT,
        ownerUserId: "user123",
      };

      const dbError = new Error("Database connection failed");

      mockOrganizationRepository.create.mockRejectedValue(dbError);

      // Act & Assert
      await expect(
        organizationService.createOrganization(createDTO)
      ).rejects.toThrow("Database connection failed");
    });

    it("should generate unique orgId", async () => {
      // Arrange
      const createDTO: CreateOrganizationDTO = {
        name: "Test Organization",
        type: OrganizationTypeEnum.DIRECT,
        ownerUserId: "user123",
      };

      const expectedOrg = {
        orgId: "mocked-uuid-1234",
        name: "Test Organization",
        type: OrganizationTypeEnum.DIRECT,
        status: OrganizationStatusEnum.ACTIVE,
        ownerUserId: "user123",
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-01-01T00:00:00.000Z"),
      };

      mockOrganizationRepository.create.mockResolvedValue(expectedOrg as any);

      // Act
      await organizationService.createOrganization(createDTO);

      // Assert
      expect(mockOrganizationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId: expect.stringContaining("mocked-uuid"),
        })
      );
    });

    it("should handle network errors", async () => {
      // Arrange
      const createDTO: CreateOrganizationDTO = {
        name: "Test Organization",
        type: OrganizationTypeEnum.DIRECT,
        ownerUserId: "user123",
      };

      const networkError = new Error("Network error");

      mockOrganizationRepository.create.mockRejectedValue(networkError);

      // Act & Assert
      await expect(
        organizationService.createOrganization(createDTO)
      ).rejects.toThrow("Network error");
    });

    it("should pass all required fields to repository", async () => {
      // Arrange
      const createDTO: CreateOrganizationDTO = {
        name: "Complete Organization",
        type: OrganizationTypeEnum.MSP,
        ownerUserId: "complete-user-123",
      };

      const expectedOrg = {
        orgId: "mocked-uuid-1234",
        name: "Complete Organization",
        type: OrganizationTypeEnum.MSP,
        status: OrganizationStatusEnum.ACTIVE,
        ownerUserId: "complete-user-123",
        createdAt: new Date("2023-01-01T00:00:00.000Z"),
        updatedAt: new Date("2023-01-01T00:00:00.000Z"),
      };

      mockOrganizationRepository.create.mockResolvedValue(expectedOrg as any);

      // Act
      await organizationService.createOrganization(createDTO);

      // Assert
      expect(mockOrganizationRepository.create).toHaveBeenCalledWith({
        orgId: "mocked-uuid-1234",
        name: "Complete Organization",
        type: OrganizationTypeEnum.MSP,
        status: OrganizationStatusEnum.ACTIVE,
        ownerUserId: "complete-user-123",
      });
    });
  });

  describe("addOrganizationMember", () => {
    it("should successfully add a member to an organization", async () => {
      // Arrange
      const orgId = "org_123";
      const memberData = {
        userId: "user_456",
        role: OrganizationMembershipRoleEnum.BILLING_ADMIN,
      };

      const mockOrganization = {
        orgId: "org_123",
        name: "Test Organization",
        type: OrganizationTypeEnum.DIRECT,
        status: OrganizationStatusEnum.ACTIVE,
        ownerUserId: "user_123",
      };

      const expectedMembership = {
        orgId: "org_123",
        userId: "user_456",
        role: OrganizationMembershipRoleEnum.BILLING_ADMIN,
        status: OrganizationMembershipStatusEnum.ACTIVE,
      };

      mockOrganizationRepository.findById.mockResolvedValue(
        mockOrganization as any
      );
      mockOrganizationMembershipRepository.findByOrgAndUser.mockResolvedValue(
        null
      );
      mockOrganizationMembershipRepository.create.mockResolvedValue(
        expectedMembership as any
      );

      // Act
      const result = await organizationService.addOrganizationMember(
        orgId,
        memberData
      );

      // Assert
      expect(mockOrganizationRepository.findById).toHaveBeenCalledWith(orgId);
      expect(
        mockOrganizationMembershipRepository.findByOrgAndUser
      ).toHaveBeenCalledWith(orgId, "user_456");
      expect(mockOrganizationMembershipRepository.create).toHaveBeenCalledWith({
        orgId: "org_123",
        userId: "user_456",
        role: OrganizationMembershipRoleEnum.BILLING_ADMIN,
        status: OrganizationMembershipStatusEnum.ACTIVE,
      });
      expect(result).toEqual(expectedMembership);
    });

    it("should throw NotFoundError when organization does not exist", async () => {
      // Arrange
      const orgId = "org_nonexistent";
      const memberData = {
        userId: "user_456",
        role: OrganizationMembershipRoleEnum.BILLING_ADMIN,
      };

      mockOrganizationRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        organizationService.addOrganizationMember(orgId, memberData)
      ).rejects.toThrow(NotFoundError);
      await expect(
        organizationService.addOrganizationMember(orgId, memberData)
      ).rejects.toThrow("Organization not found");
    });

    it("should return existing membership when user already has same role (idempotent)", async () => {
      // Arrange
      const orgId = "org_123";
      const memberData = {
        userId: "user_456",
        role: OrganizationMembershipRoleEnum.BILLING_ADMIN,
      };

      const mockOrganization = {
        orgId: "org_123",
        name: "Test Organization",
        type: OrganizationTypeEnum.DIRECT,
        status: OrganizationStatusEnum.ACTIVE,
        ownerUserId: "user_123",
      };

      const existingMembership = {
        orgId: "org_123",
        userId: "user_456",
        role: OrganizationMembershipRoleEnum.BILLING_ADMIN,
        status: OrganizationMembershipStatusEnum.ACTIVE,
      };

      mockOrganizationRepository.findById.mockResolvedValue(
        mockOrganization as any
      );
      mockOrganizationMembershipRepository.findByOrgAndUser.mockResolvedValue(
        existingMembership as any
      );

      // Act
      const result = await organizationService.addOrganizationMember(
        orgId,
        memberData
      );

      // Assert
      expect(
        mockOrganizationMembershipRepository.create
      ).not.toHaveBeenCalled();
      expect(result).toEqual(existingMembership);
    });

    it("should throw ConflictError when user already has different role", async () => {
      // Arrange
      const orgId = "org_123";
      const memberData = {
        userId: "user_456",
        role: OrganizationMembershipRoleEnum.BILLING_ADMIN,
      };

      const mockOrganization = {
        orgId: "org_123",
        name: "Test Organization",
        type: OrganizationTypeEnum.DIRECT,
        status: OrganizationStatusEnum.ACTIVE,
        ownerUserId: "user_123",
      };

      const existingMembership = {
        orgId: "org_123",
        userId: "user_456",
        role: OrganizationMembershipRoleEnum.SUPPORT,
        status: OrganizationMembershipStatusEnum.ACTIVE,
      };

      mockOrganizationRepository.findById.mockResolvedValue(
        mockOrganization as any
      );
      mockOrganizationMembershipRepository.findByOrgAndUser.mockResolvedValue(
        existingMembership as any
      );

      // Act & Assert
      await expect(
        organizationService.addOrganizationMember(orgId, memberData)
      ).rejects.toThrow(ConflictError);
      await expect(
        organizationService.addOrganizationMember(orgId, memberData)
      ).rejects.toThrow(
        "User is already a member of this organization with a different role"
      );
    });

    it("should handle duplicate key error from database (11000)", async () => {
      // Arrange
      const orgId = "org_123";
      const memberData = {
        userId: "user_456",
        role: OrganizationMembershipRoleEnum.BILLING_ADMIN,
      };

      const mockOrganization = {
        orgId: "org_123",
        name: "Test Organization",
        type: OrganizationTypeEnum.DIRECT,
        status: OrganizationStatusEnum.ACTIVE,
        ownerUserId: "user_123",
      };

      const duplicateError: any = new Error("Duplicate key error");
      duplicateError.code = 11000;

      mockOrganizationRepository.findById.mockResolvedValue(
        mockOrganization as any
      );
      mockOrganizationMembershipRepository.findByOrgAndUser.mockResolvedValue(
        null
      );
      mockOrganizationMembershipRepository.create.mockRejectedValue(
        duplicateError
      );

      // Act & Assert
      await expect(
        organizationService.addOrganizationMember(orgId, memberData)
      ).rejects.toThrow(ConflictError);
      await expect(
        organizationService.addOrganizationMember(orgId, memberData)
      ).rejects.toThrow("User is already a member of this organization");
    });

    it("should add member with ORG_ADMIN role", async () => {
      // Arrange
      const orgId = "org_123";
      const memberData = {
        userId: "user_789",
        role: OrganizationMembershipRoleEnum.ORG_ADMIN,
      };

      const mockOrganization = {
        orgId: "org_123",
        name: "Test Organization",
        type: OrganizationTypeEnum.DIRECT,
        status: OrganizationStatusEnum.ACTIVE,
        ownerUserId: "user_123",
      };

      const expectedMembership = {
        orgId: "org_123",
        userId: "user_789",
        role: OrganizationMembershipRoleEnum.ORG_ADMIN,
        status: OrganizationMembershipStatusEnum.ACTIVE,
      };

      mockOrganizationRepository.findById.mockResolvedValue(
        mockOrganization as any
      );
      mockOrganizationMembershipRepository.findByOrgAndUser.mockResolvedValue(
        null
      );
      mockOrganizationMembershipRepository.create.mockResolvedValue(
        expectedMembership as any
      );

      // Act
      const result = await organizationService.addOrganizationMember(
        orgId,
        memberData
      );

      // Assert
      expect(result.role).toBe(OrganizationMembershipRoleEnum.ORG_ADMIN);
    });

    it("should add member with SUPPORT role", async () => {
      // Arrange
      const orgId = "org_123";
      const memberData = {
        userId: "user_999",
        role: OrganizationMembershipRoleEnum.SUPPORT,
      };

      const mockOrganization = {
        orgId: "org_123",
        name: "Test Organization",
        type: OrganizationTypeEnum.DIRECT,
        status: OrganizationStatusEnum.ACTIVE,
        ownerUserId: "user_123",
      };

      const expectedMembership = {
        orgId: "org_123",
        userId: "user_999",
        role: OrganizationMembershipRoleEnum.SUPPORT,
        status: OrganizationMembershipStatusEnum.ACTIVE,
      };

      mockOrganizationRepository.findById.mockResolvedValue(
        mockOrganization as any
      );
      mockOrganizationMembershipRepository.findByOrgAndUser.mockResolvedValue(
        null
      );
      mockOrganizationMembershipRepository.create.mockResolvedValue(
        expectedMembership as any
      );

      // Act
      const result = await organizationService.addOrganizationMember(
        orgId,
        memberData
      );

      // Assert
      expect(result.role).toBe(OrganizationMembershipRoleEnum.SUPPORT);
    });

    it("should set membership status to ACTIVE by default", async () => {
      // Arrange
      const orgId = "org_123";
      const memberData = {
        userId: "user_456",
        role: OrganizationMembershipRoleEnum.BILLING_ADMIN,
      };

      const mockOrganization = {
        orgId: "org_123",
        name: "Test Organization",
        type: OrganizationTypeEnum.DIRECT,
        status: OrganizationStatusEnum.ACTIVE,
        ownerUserId: "user_123",
      };

      const expectedMembership = {
        orgId: "org_123",
        userId: "user_456",
        role: OrganizationMembershipRoleEnum.BILLING_ADMIN,
        status: OrganizationMembershipStatusEnum.ACTIVE,
      };

      mockOrganizationRepository.findById.mockResolvedValue(
        mockOrganization as any
      );
      mockOrganizationMembershipRepository.findByOrgAndUser.mockResolvedValue(
        null
      );
      mockOrganizationMembershipRepository.create.mockResolvedValue(
        expectedMembership as any
      );

      // Act
      const result = await organizationService.addOrganizationMember(
        orgId,
        memberData
      );

      // Assert
      expect(mockOrganizationMembershipRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrganizationMembershipStatusEnum.ACTIVE,
        })
      );
      expect(result.status).toBe(OrganizationMembershipStatusEnum.ACTIVE);
    });
  });
});
