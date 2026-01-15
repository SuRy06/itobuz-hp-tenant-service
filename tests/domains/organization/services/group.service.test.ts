import "reflect-metadata";
import { GroupService } from "../../../../src/domains/organization/services/group.service";
import { GroupRepository } from "../../../../src/domains/organization/repositories/group.repository";
import { TenantRepository } from "../../../../src/domains/organization/repositories/tenant.repository";
import { GroupStatusEnum, TenantStatusEnum } from "../../../../src/types/config";
import { HttpError } from "../../../../src/domains/common/errors/http.error";

// Mock uuid
jest.mock("uuid");

describe("GroupService", () => {
  let groupService: GroupService;
  let mockGroupRepository: jest.Mocked<GroupRepository>;
  let mockTenantRepository: jest.Mocked<TenantRepository>;

  beforeEach(() => {
    // Mock uuid implementation
    const { v4: uuid4 } = require("uuid");
    (uuid4 as jest.Mock).mockReturnValue("mocked-group-uuid-1234");

    // Create mock repositories
    mockGroupRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdAndTenant: jest.fn(),
      findByTenantId: jest.fn(),
      findByTenantAndParent: jest.fn(),
      findByNameAndParent: jest.fn(),
      update: jest.fn(),
    } as any;

    mockTenantRepository = {
      findById: jest.fn(),
    } as any;

    // Additional repositories required by GroupService constructor
    const mockGroupMembershipRepository = {
      create: jest.fn(),
      findByGroupAndUser: jest.fn(),
    } as any;

    const mockTenantMembershipRepository = {
      findByTenantAndUser: jest.fn(),
    } as any;

    // Create service instance
    groupService = new GroupService(
      mockGroupRepository,
      mockTenantRepository,
      mockGroupMembershipRepository,
      mockTenantMembershipRepository
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("createGroup", () => {
    const mockTenant = {
      tenantId: "tenant-123",
      orgId: "org-123",
      name: "Test Tenant",
      status: TenantStatusEnum.ACTIVE,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    } as any;

    const mockGroup = {
      groupId: "mocked-group-uuid-1234",
      tenantId: "tenant-123",
      name: "Engineering",
      parentGroupId: undefined,
      status: GroupStatusEnum.ACTIVE,
      createdAt: new Date("2024-01-01"),
    } as any;

    it("should successfully create a group with valid tenant", async () => {
      // Arrange
      mockTenantRepository.findById.mockResolvedValue(mockTenant);
      mockGroupRepository.findByNameAndParent.mockResolvedValue(null);
      mockGroupRepository.create.mockResolvedValue(mockGroup);

      // Act
      const result = await groupService.createGroup({
        tenantId: "tenant-123",
        name: "Engineering",
      });

      // Assert
      expect(mockTenantRepository.findById).toHaveBeenCalledWith("tenant-123");
      expect(mockGroupRepository.findByNameAndParent).toHaveBeenCalledWith("tenant-123", "Engineering", null);
      expect(mockGroupRepository.create).toHaveBeenCalledWith({
        groupId: "mocked-group-uuid-1234",
        tenantId: "tenant-123",
        name: "Engineering",
        parentGroupId: undefined,
        status: GroupStatusEnum.ACTIVE,
      });
      expect(result).toEqual(mockGroup);
    });

    it("should throw 404 error when tenant does not exist", async () => {
      // Arrange
      mockTenantRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        groupService.createGroup({
          tenantId: "tenant-nonexistent",
          name: "Engineering",
        })
      ).rejects.toThrow(new HttpError(404, "Tenant not found"));

      expect(mockTenantRepository.findById).toHaveBeenCalledWith("tenant-nonexistent");
      expect(mockGroupRepository.create).not.toHaveBeenCalled();
    });

    it("should throw 400 error when tenant is not ACTIVE", async () => {
      // Arrange
      const inactiveTenant = {
        ...mockTenant,
        status: TenantStatusEnum.DEACTIVATED,
      };
      mockTenantRepository.findById.mockResolvedValue(inactiveTenant);

      // Act & Assert
      await expect(
        groupService.createGroup({
          tenantId: "tenant-123",
          name: "Engineering",
        })
      ).rejects.toThrow(new HttpError(400, "Tenant must be ACTIVE to create groups"));

      expect(mockGroupRepository.create).not.toHaveBeenCalled();
    });

    it("should throw 409 error when group name already exists under same parent", async () => {
      // Arrange
      mockTenantRepository.findById.mockResolvedValue(mockTenant);
      mockGroupRepository.findByNameAndParent.mockResolvedValue(mockGroup);

      // Act & Assert
      await expect(
        groupService.createGroup({
          tenantId: "tenant-123",
          name: "Engineering",
        })
      ).rejects.toThrow(new HttpError(409, "Group with this name already exists under the same parent"));

      expect(mockGroupRepository.create).not.toHaveBeenCalled();
    });

    it("should successfully create group with valid parent group", async () => {
      // Arrange
      const parentGroup = {
        groupId: "parent-123",
        tenantId: "tenant-123",
        name: "Parent Group",
        status: GroupStatusEnum.ACTIVE,
      } as any;

      const childGroup = {
        ...mockGroup,
        parentGroupId: "parent-123",
      };

      mockTenantRepository.findById.mockResolvedValue(mockTenant);
      mockGroupRepository.findByIdAndTenant.mockResolvedValue(parentGroup);
      mockGroupRepository.findByNameAndParent.mockResolvedValue(null);
      mockGroupRepository.create.mockResolvedValue(childGroup);

      // Act
      const result = await groupService.createGroup({
        tenantId: "tenant-123",
        name: "Engineering",
        parentGroupId: "parent-123",
      });

      // Assert
      expect(mockGroupRepository.findByIdAndTenant).toHaveBeenCalledWith("parent-123", "tenant-123");
      expect(result).toEqual(childGroup);
    });

    it("should throw 404 error when parent group not found or belongs to different tenant", async () => {
      // Arrange
      mockTenantRepository.findById.mockResolvedValue(mockTenant);
      mockGroupRepository.findByIdAndTenant.mockResolvedValue(null);

      // Act & Assert
      await expect(
        groupService.createGroup({
          tenantId: "tenant-123",
          name: "Engineering",
          parentGroupId: "parent-nonexistent",
        })
      ).rejects.toThrow(new HttpError(404, "Parent group not found or does not belong to this tenant"));

      expect(mockGroupRepository.findByIdAndTenant).toHaveBeenCalledWith("parent-nonexistent", "tenant-123");
      expect(mockGroupRepository.create).not.toHaveBeenCalled();
    });

    it("should throw 400 error when parent group is archived", async () => {
      // Arrange
      const archivedParent = {
        groupId: "parent-123",
        tenantId: "tenant-123",
        name: "Parent Group",
        status: GroupStatusEnum.ARCHIVED,
      } as any;

      mockTenantRepository.findById.mockResolvedValue(mockTenant);
      mockGroupRepository.findByIdAndTenant.mockResolvedValue(archivedParent);

      // Act & Assert
      await expect(
        groupService.createGroup({
          tenantId: "tenant-123",
          name: "Engineering",
          parentGroupId: "parent-123",
        })
      ).rejects.toThrow(new HttpError(400, "Cannot create group under archived parent"));

      expect(mockGroupRepository.findByIdAndTenant).toHaveBeenCalledWith("parent-123", "tenant-123");
      expect(mockGroupRepository.create).not.toHaveBeenCalled();
    });
  });
  describe("addUserToGroup", () => {
    let mockGroupMembershipRepository: jest.Mocked<any>;
    let mockTenantMembershipRepository: jest.Mocked<any>;

    beforeEach(() => {
      mockGroupMembershipRepository = {
        create: jest.fn(),
        findByGroupAndUser: jest.fn(),
      } as any;

      mockTenantMembershipRepository = {
        findByTenantAndUser: jest.fn(),
      } as any;

      groupService = new GroupService(
        mockGroupRepository,
        mockTenantRepository,
        mockGroupMembershipRepository,
        mockTenantMembershipRepository
      );
    });

    const mockTenant = {
      tenantId: "tenant-123",
      orgId: "org-123",
      name: "Test Tenant",
      status: TenantStatusEnum.ACTIVE,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    } as any;

    const mockGroup = {
      groupId: "group-123",
      tenantId: "tenant-123",
      name: "Engineering",
      status: GroupStatusEnum.ACTIVE,
      createdAt: new Date("2024-01-01"),
    } as any;

    const mockTenantMembership = {
      tenantId: "tenant-123",
      userId: "user-123",
      status: "ACTIVE" as any,
      createdAt: new Date("2024-01-01"),
    } as any;

    const mockGroupMembership = {
      tenantId: "tenant-123",
      groupId: "group-123",
      userId: "user-123",
      status: "ACTIVE" as any,
      createdAt: new Date("2024-01-01"),
    } as any;

    it("should successfully add user to group", async () => {
      // Arrange
      mockGroupRepository.findByIdAndTenant.mockResolvedValue(mockGroup);
      mockTenantRepository.findById.mockResolvedValue(mockTenant);
      mockTenantMembershipRepository.findByTenantAndUser.mockResolvedValue(mockTenantMembership);
      mockGroupMembershipRepository.findByGroupAndUser.mockResolvedValue(null);
      mockGroupMembershipRepository.create.mockResolvedValue(mockGroupMembership);

      // Act
      const result = await groupService.addUserToGroup("tenant-123", "group-123", { userId: "user-123" });

      // Assert
      expect(mockGroupRepository.findByIdAndTenant).toHaveBeenCalledWith("group-123", "tenant-123");
      expect(mockTenantRepository.findById).toHaveBeenCalledWith("tenant-123");
      expect(mockTenantMembershipRepository.findByTenantAndUser).toHaveBeenCalledWith("tenant-123", "user-123");
      expect(mockGroupMembershipRepository.findByGroupAndUser).toHaveBeenCalledWith("group-123", "user-123");
      expect(mockGroupMembershipRepository.create).toHaveBeenCalledWith({
        tenantId: "tenant-123",
        groupId: "group-123",
        userId: "user-123",
        status: "ACTIVE",
      });
      expect(result).toEqual(mockGroupMembership);
    });

    it("should throw 404 error when group not found or does not belong to tenant", async () => {
      // Arrange
      mockGroupRepository.findByIdAndTenant.mockResolvedValue(null);

      // Act & Assert
      await expect(
        groupService.addUserToGroup("tenant-123", "group-nonexistent", { userId: "user-123" })
      ).rejects.toThrow(new HttpError(404, "Group not found or does not belong to this tenant"));

      expect(mockGroupMembershipRepository.create).not.toHaveBeenCalled();
    });

    it("should throw 400 error when group is not ACTIVE", async () => {
      // Arrange
      const inactiveGroup = { ...mockGroup, status: GroupStatusEnum.ARCHIVED };
      mockGroupRepository.findByIdAndTenant.mockResolvedValue(inactiveGroup);

      // Act & Assert
      await expect(groupService.addUserToGroup("tenant-123", "group-123", { userId: "user-123" })).rejects.toThrow(
        new HttpError(400, "Group must be ACTIVE to add users")
      );

      expect(mockGroupMembershipRepository.create).not.toHaveBeenCalled();
    });

    it("should throw 404 error when tenant not found", async () => {
      // Arrange
      mockGroupRepository.findByIdAndTenant.mockResolvedValue(mockGroup);
      mockTenantRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        groupService.addUserToGroup("tenant-nonexistent", "group-123", { userId: "user-123" })
      ).rejects.toThrow(new HttpError(404, "Tenant not found"));

      expect(mockGroupMembershipRepository.create).not.toHaveBeenCalled();
    });

    it("should throw 400 error when tenant is not ACTIVE", async () => {
      // Arrange
      const inactiveTenant = { ...mockTenant, status: TenantStatusEnum.DEACTIVATED };
      mockGroupRepository.findByIdAndTenant.mockResolvedValue(mockGroup);
      mockTenantRepository.findById.mockResolvedValue(inactiveTenant);

      // Act & Assert
      await expect(groupService.addUserToGroup("tenant-123", "group-123", { userId: "user-123" })).rejects.toThrow(
        new HttpError(400, "Tenant must be ACTIVE")
      );

      expect(mockGroupMembershipRepository.create).not.toHaveBeenCalled();
    });

    it("should throw 400 error when user is not a tenant member", async () => {
      // Arrange
      mockGroupRepository.findByIdAndTenant.mockResolvedValue(mockGroup);
      mockTenantRepository.findById.mockResolvedValue(mockTenant);
      mockTenantMembershipRepository.findByTenantAndUser.mockResolvedValue(null);

      // Act & Assert
      await expect(groupService.addUserToGroup("tenant-123", "group-123", { userId: "user-123" })).rejects.toThrow(
        new HttpError(400, "User must be a member of the tenant before joining a group")
      );

      expect(mockGroupMembershipRepository.create).not.toHaveBeenCalled();
    });

    it("should throw 400 error when user tenant membership is not ACTIVE", async () => {
      // Arrange
      const inactiveMembership = { ...mockTenantMembership, status: "SUSPENDED" as any };
      mockGroupRepository.findByIdAndTenant.mockResolvedValue(mockGroup);
      mockTenantRepository.findById.mockResolvedValue(mockTenant);
      mockTenantMembershipRepository.findByTenantAndUser.mockResolvedValue(inactiveMembership);

      // Act & Assert
      await expect(groupService.addUserToGroup("tenant-123", "group-123", { userId: "user-123" })).rejects.toThrow(
        new HttpError(400, "User must be an ACTIVE tenant member. Current status: SUSPENDED")
      );

      expect(mockGroupMembershipRepository.create).not.toHaveBeenCalled();
    });

    it("should throw 409 error when user already has membership in group", async () => {
      // Arrange
      mockGroupRepository.findByIdAndTenant.mockResolvedValue(mockGroup);
      mockTenantRepository.findById.mockResolvedValue(mockTenant);
      mockTenantMembershipRepository.findByTenantAndUser.mockResolvedValue(mockTenantMembership);
      mockGroupMembershipRepository.findByGroupAndUser.mockResolvedValue(mockGroupMembership);

      // Act & Assert
      await expect(groupService.addUserToGroup("tenant-123", "group-123", { userId: "user-123" })).rejects.toThrow(
        new HttpError(409, "User already has ACTIVE membership in this group")
      );

      expect(mockGroupMembershipRepository.create).not.toHaveBeenCalled();
    });
  });
});
