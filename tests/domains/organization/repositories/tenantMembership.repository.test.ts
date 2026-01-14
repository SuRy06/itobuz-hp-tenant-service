import "reflect-metadata";
import { TenantMembershipRepository } from "../../../../src/domains/organization/repositories/tenantMembership.repository";
import { MongoDBConnectionManager } from "../../../../src/infrastructure/database/mongodbmanager.service";
import { getTenantMembershipModel } from "../../../../src/domains/organization/models/tenantMembership.model";
import { TenantMembershipStatusEnum } from "../../../../src/types/config";

jest.mock("../../../../src/domains/organization/models/tenantMembership.model");

describe("TenantMembershipRepository", () => {
  let tenantMembershipRepository: TenantMembershipRepository;
  let mockMongoManager: jest.Mocked<MongoDBConnectionManager>;

  beforeEach(() => {
    mockMongoManager = {
      getConnection: jest.fn(),
    } as any;

    tenantMembershipRepository = new TenantMembershipRepository(
      mockMongoManager
    );
  });

  describe("instantiation", () => {
    it("should create repository instance with MongoDB manager", () => {
      expect(tenantMembershipRepository).toBeDefined();
      expect(tenantMembershipRepository).toBeInstanceOf(
        TenantMembershipRepository
      );
    });
  });

  describe("create", () => {
    it("should create a new tenant membership", async () => {
      const mockMembershipData = {
        tenantId: "tenant_123",
        userId: "user_456",
        status: TenantMembershipStatusEnum.ACTIVE,
      };

      const mockSavedMembership = {
        ...mockMembershipData,
        _id: "mongo-id",
        createdAt: new Date(),
      };

      const mockSave = jest.fn().mockResolvedValue(mockSavedMembership);
      const mockMembershipModel = jest.fn().mockImplementation(() => ({
        save: mockSave,
      }));
      const mockConnection = {};

      mockMongoManager.getConnection.mockReturnValue(mockConnection as any);
      (getTenantMembershipModel as jest.Mock).mockReturnValue(
        mockMembershipModel
      );

      const result =
        await tenantMembershipRepository.create(mockMembershipData);

      expect(getTenantMembershipModel).toHaveBeenCalledWith(mockConnection);
      expect(mockMembershipModel).toHaveBeenCalledWith(mockMembershipData);
      expect(mockSave).toHaveBeenCalled();
      expect(result).toEqual(mockSavedMembership);
    });
  });

  describe("findByTenantAndUser", () => {
    it("should find membership by tenantId and userId", async () => {
      const mockTenantId = "tenant_123";
      const mockUserId = "user_456";
      const mockMembership = {
        tenantId: mockTenantId,
        userId: mockUserId,
        status: TenantMembershipStatusEnum.ACTIVE,
      };

      const mockExec = jest.fn().mockResolvedValue(mockMembership);
      const mockFindOne = jest.fn().mockReturnValue({ exec: mockExec });
      const mockMembershipModel = { findOne: mockFindOne };
      const mockConnection = {};

      mockMongoManager.getConnection.mockReturnValue(mockConnection as any);
      (getTenantMembershipModel as jest.Mock).mockReturnValue(
        mockMembershipModel
      );

      const result = await tenantMembershipRepository.findByTenantAndUser(
        mockTenantId,
        mockUserId
      );

      expect(getTenantMembershipModel).toHaveBeenCalledWith(mockConnection);
      expect(mockFindOne).toHaveBeenCalledWith({
        tenantId: mockTenantId,
        userId: mockUserId,
      });
      expect(mockExec).toHaveBeenCalled();
      expect(result).toEqual(mockMembership);
    });

    it("should return null when membership not found", async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      const mockFindOne = jest.fn().mockReturnValue({ exec: mockExec });
      const mockMembershipModel = { findOne: mockFindOne };
      const mockConnection = {};

      mockMongoManager.getConnection.mockReturnValue(mockConnection as any);
      (getTenantMembershipModel as jest.Mock).mockReturnValue(
        mockMembershipModel
      );

      const result = await tenantMembershipRepository.findByTenantAndUser(
        "tenant_nonexistent",
        "user_nonexistent"
      );

      expect(result).toBeNull();
    });
  });

  describe("update", () => {
    it("should update tenant membership", async () => {
      const mockTenantId = "tenant_123";
      const mockUserId = "user_456";
      const mockUpdateData = {
        status: TenantMembershipStatusEnum.ACTIVE,
      };

      const mockUpdatedMembership = {
        tenantId: mockTenantId,
        userId: mockUserId,
        status: TenantMembershipStatusEnum.ACTIVE,
      };

      const mockExec = jest.fn().mockResolvedValue(mockUpdatedMembership);
      const mockFindOneAndUpdate = jest
        .fn()
        .mockReturnValue({ exec: mockExec });
      const mockMembershipModel = {
        findOneAndUpdate: mockFindOneAndUpdate,
      };
      const mockConnection = {};

      mockMongoManager.getConnection.mockReturnValue(mockConnection as any);
      (getTenantMembershipModel as jest.Mock).mockReturnValue(
        mockMembershipModel
      );

      const result = await tenantMembershipRepository.update(
        mockTenantId,
        mockUserId,
        mockUpdateData
      );

      expect(getTenantMembershipModel).toHaveBeenCalledWith(mockConnection);
      expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
        { tenantId: mockTenantId, userId: mockUserId },
        { $set: mockUpdateData },
        { new: true }
      );
      expect(mockExec).toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedMembership);
    });

    it("should return null when membership to update not found", async () => {
      const mockExec = jest.fn().mockResolvedValue(null);
      const mockFindOneAndUpdate = jest
        .fn()
        .mockReturnValue({ exec: mockExec });
      const mockMembershipModel = {
        findOneAndUpdate: mockFindOneAndUpdate,
      };
      const mockConnection = {};

      mockMongoManager.getConnection.mockReturnValue(mockConnection as any);
      (getTenantMembershipModel as jest.Mock).mockReturnValue(
        mockMembershipModel
      );

      const result = await tenantMembershipRepository.update(
        "tenant_nonexistent",
        "user_nonexistent",
        { status: TenantMembershipStatusEnum.ACTIVE }
      );

      expect(result).toBeNull();
    });
  });
});
