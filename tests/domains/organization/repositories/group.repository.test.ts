import "reflect-metadata";
import { GroupRepository } from "../../../../src/domains/organization/repositories/group.repository";
import { MongoDBConnectionManager } from "../../../../src/infrastructure/database/mongodbmanager.service";
import { getGroupModel } from "../../../../src/domains/organization/models/group.model";

jest.mock("../../../../src/domains/organization/models/group.model");

describe("GroupRepository", () => {
  let groupRepository: GroupRepository;
  let mockMongoManager: jest.Mocked<MongoDBConnectionManager>;

  beforeEach(() => {
    mockMongoManager = {
      getConnection: jest.fn(),
    } as any;

    groupRepository = new GroupRepository(mockMongoManager);
  });

  describe("instantiation", () => {
    it("should create repository instance with MongoDB manager", () => {
      expect(groupRepository).toBeDefined();
      expect(groupRepository).toBeInstanceOf(GroupRepository);
    });
  });

  describe("create", () => {
    it("should create a new group", async () => {
      const mockGroupData = {
        groupId: "group-123",
        tenantId: "tenant-123",
        name: "Engineering",
      };
      const mockSavedGroup = { ...mockGroupData, _id: "mongo-id" };
      const mockSave = jest.fn().mockResolvedValue(mockSavedGroup);
      const mockGroupModel = jest.fn().mockImplementation(() => ({
        save: mockSave,
      }));
      const mockConnection = {};

      mockMongoManager.getConnection.mockReturnValue(mockConnection as any);
      (getGroupModel as jest.Mock).mockReturnValue(mockGroupModel);

      const result = await groupRepository.create(mockGroupData);

      expect(getGroupModel).toHaveBeenCalledWith(mockConnection);
      expect(mockGroupModel).toHaveBeenCalledWith(mockGroupData);
      expect(mockSave).toHaveBeenCalled();
      expect(result).toEqual(mockSavedGroup);
    });
  });

  describe("findById", () => {
    it("should find group by groupId", async () => {
      const mockGroupId = "group-123";
      const mockGroup = {
        groupId: mockGroupId,
        tenantId: "tenant-123",
        name: "Engineering",
      };
      const mockExec = jest.fn().mockResolvedValue(mockGroup);
      const mockFindOne = jest.fn().mockReturnValue({ exec: mockExec });
      const mockGroupModel = { findOne: mockFindOne };
      const mockConnection = {};

      mockMongoManager.getConnection.mockReturnValue(mockConnection as any);
      (getGroupModel as jest.Mock).mockReturnValue(mockGroupModel);

      const result = await groupRepository.findById(mockGroupId);

      expect(getGroupModel).toHaveBeenCalledWith(mockConnection);
      expect(mockFindOne).toHaveBeenCalledWith({ groupId: mockGroupId });
      expect(mockExec).toHaveBeenCalled();
      expect(result).toEqual(mockGroup);
    });

    it("should return null when group not found", async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      const mockFindOne = jest.fn().mockReturnValue({ exec: mockExec });
      const mockGroupModel = { findOne: mockFindOne };
      const mockConnection = {};

      mockMongoManager.getConnection.mockReturnValue(mockConnection as any);
      (getGroupModel as jest.Mock).mockReturnValue(mockGroupModel);

      const result = await groupRepository.findById("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("findByIdAndTenant", () => {
    it("should find group by groupId and tenantId", async () => {
      const mockGroupId = "group-123";
      const mockTenantId = "tenant-123";
      const mockGroup = {
        groupId: mockGroupId,
        tenantId: mockTenantId,
        name: "Engineering",
      };
      const mockExec = jest.fn().mockResolvedValue(mockGroup);
      const mockFindOne = jest.fn().mockReturnValue({ exec: mockExec });
      const mockGroupModel = { findOne: mockFindOne };
      const mockConnection = {};

      mockMongoManager.getConnection.mockReturnValue(mockConnection as any);
      (getGroupModel as jest.Mock).mockReturnValue(mockGroupModel);

      const result = await groupRepository.findByIdAndTenant(mockGroupId, mockTenantId);

      expect(getGroupModel).toHaveBeenCalledWith(mockConnection);
      expect(mockFindOne).toHaveBeenCalledWith({
        groupId: mockGroupId,
        tenantId: mockTenantId,
      });
      expect(mockExec).toHaveBeenCalled();
      expect(result).toEqual(mockGroup);
    });

    it("should return null when group not found in tenant", async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      const mockFindOne = jest.fn().mockReturnValue({ exec: mockExec });
      const mockGroupModel = { findOne: mockFindOne };
      const mockConnection = {};

      mockMongoManager.getConnection.mockReturnValue(mockConnection as any);
      (getGroupModel as jest.Mock).mockReturnValue(mockGroupModel);

      const result = await groupRepository.findByIdAndTenant("group-123", "wrong-tenant");

      expect(result).toBeNull();
    });
  });

  describe("findByTenantId", () => {
    it("should find all groups for a tenant", async () => {
      const mockTenantId = "tenant-123";
      const mockGroups = [
        { groupId: "group-1", tenantId: mockTenantId, name: "Engineering" },
        { groupId: "group-2", tenantId: mockTenantId, name: "Sales" },
      ];
      const mockExec = jest.fn().mockResolvedValue(mockGroups);
      const mockFind = jest.fn().mockReturnValue({ exec: mockExec });
      const mockGroupModel = { find: mockFind };
      const mockConnection = {};

      mockMongoManager.getConnection.mockReturnValue(mockConnection as any);
      (getGroupModel as jest.Mock).mockReturnValue(mockGroupModel);

      const result = await groupRepository.findByTenantId(mockTenantId);

      expect(getGroupModel).toHaveBeenCalledWith(mockConnection);
      expect(mockFind).toHaveBeenCalledWith({ tenantId: mockTenantId });
      expect(mockExec).toHaveBeenCalled();
      expect(result).toEqual(mockGroups);
    });

    it("should return empty array when no groups found", async () => {
      const mockExec = jest.fn().mockResolvedValue([]);
      const mockFind = jest.fn().mockReturnValue({ exec: mockExec });
      const mockGroupModel = { find: mockFind };
      const mockConnection = {};

      mockMongoManager.getConnection.mockReturnValue(mockConnection as any);
      (getGroupModel as jest.Mock).mockReturnValue(mockGroupModel);

      const result = await groupRepository.findByTenantId("tenant-123");

      expect(result).toEqual([]);
    });
  });

  describe("findByTenantAndParent", () => {
    it("should find all groups for tenant and parent", async () => {
      const mockTenantId = "tenant-123";
      const mockParentGroupId = "parent-123";
      const mockGroups = [
        {
          groupId: "group-1",
          tenantId: mockTenantId,
          parentGroupId: mockParentGroupId,
          name: "Team A",
        },
        {
          groupId: "group-2",
          tenantId: mockTenantId,
          parentGroupId: mockParentGroupId,
          name: "Team B",
        },
      ];
      const mockExec = jest.fn().mockResolvedValue(mockGroups);
      const mockFind = jest.fn().mockReturnValue({ exec: mockExec });
      const mockGroupModel = { find: mockFind };
      const mockConnection = {};

      mockMongoManager.getConnection.mockReturnValue(mockConnection as any);
      (getGroupModel as jest.Mock).mockReturnValue(mockGroupModel);

      const result = await groupRepository.findByTenantAndParent(mockTenantId, mockParentGroupId);

      expect(getGroupModel).toHaveBeenCalledWith(mockConnection);
      expect(mockFind).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        parentGroupId: mockParentGroupId,
      });
      expect(mockExec).toHaveBeenCalled();
      expect(result).toEqual(mockGroups);
    });

    it("should find top-level groups when parentGroupId is null", async () => {
      const mockTenantId = "tenant-123";
      const mockGroups = [
        {
          groupId: "group-1",
          tenantId: mockTenantId,
          parentGroupId: null,
          name: "Engineering",
        },
      ];
      const mockExec = jest.fn().mockResolvedValue(mockGroups);
      const mockFind = jest.fn().mockReturnValue({ exec: mockExec });
      const mockGroupModel = { find: mockFind };
      const mockConnection = {};

      mockMongoManager.getConnection.mockReturnValue(mockConnection as any);
      (getGroupModel as jest.Mock).mockReturnValue(mockGroupModel);

      const result = await groupRepository.findByTenantAndParent(mockTenantId, null);

      expect(mockFind).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        parentGroupId: null,
      });
      expect(result).toEqual(mockGroups);
    });
  });

  describe("findByNameAndParent", () => {
    it("should find group by name and parent within tenant", async () => {
      const mockTenantId = "tenant-123";
      const mockName = "Engineering";
      const mockParentGroupId = "parent-123";
      const mockGroup = {
        groupId: "group-123",
        tenantId: mockTenantId,
        name: mockName,
        parentGroupId: mockParentGroupId,
      };
      const mockExec = jest.fn().mockResolvedValue(mockGroup);
      const mockFindOne = jest.fn().mockReturnValue({ exec: mockExec });
      const mockGroupModel = { findOne: mockFindOne };
      const mockConnection = {};

      mockMongoManager.getConnection.mockReturnValue(mockConnection as any);
      (getGroupModel as jest.Mock).mockReturnValue(mockGroupModel);

      const result = await groupRepository.findByNameAndParent(mockTenantId, mockName, mockParentGroupId);

      expect(getGroupModel).toHaveBeenCalledWith(mockConnection);
      expect(mockFindOne).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        name: mockName,
        parentGroupId: mockParentGroupId,
      });
      expect(mockExec).toHaveBeenCalled();
      expect(result).toEqual(mockGroup);
    });

    it("should find top-level group by name when parentGroupId is null", async () => {
      const mockTenantId = "tenant-123";
      const mockName = "Engineering";
      const mockGroup = {
        groupId: "group-123",
        tenantId: mockTenantId,
        name: mockName,
        parentGroupId: null,
      };
      const mockExec = jest.fn().mockResolvedValue(mockGroup);
      const mockFindOne = jest.fn().mockReturnValue({ exec: mockExec });
      const mockGroupModel = { findOne: mockFindOne };
      const mockConnection = {};

      mockMongoManager.getConnection.mockReturnValue(mockConnection as any);
      (getGroupModel as jest.Mock).mockReturnValue(mockGroupModel);

      const result = await groupRepository.findByNameAndParent(mockTenantId, mockName, null);

      expect(mockFindOne).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        name: mockName,
        parentGroupId: null,
      });
      expect(result).toEqual(mockGroup);
    });

    it("should return null when group name not found", async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      const mockFindOne = jest.fn().mockReturnValue({ exec: mockExec });
      const mockGroupModel = { findOne: mockFindOne };
      const mockConnection = {};

      mockMongoManager.getConnection.mockReturnValue(mockConnection as any);
      (getGroupModel as jest.Mock).mockReturnValue(mockGroupModel);

      const result = await groupRepository.findByNameAndParent("tenant-123", "NonExistent", null);

      expect(result).toBeNull();
    });
  });
});
