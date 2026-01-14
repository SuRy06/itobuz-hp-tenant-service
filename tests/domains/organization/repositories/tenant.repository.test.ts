import "reflect-metadata";
import { TenantRepository } from "../../../../src/domains/organization/repositories/tenant.repository";
import { MongoDBConnectionManager } from "../../../../src/infrastructure/database/mongodbmanager.service";
import { getTenantModel } from "../../../../src/domains/organization/models/tenant.model";

jest.mock("../../../../src/domains/organization/models/tenant.model");

describe("TenantRepository", () => {
  let tenantRepository: TenantRepository;
  let mockMongoManager: jest.Mocked<MongoDBConnectionManager>;

  beforeEach(() => {
    mockMongoManager = {
      getConnection: jest.fn(),
    } as any;

    tenantRepository = new TenantRepository(mockMongoManager);
  });

  describe("instantiation", () => {
    it("should create repository instance with MongoDB manager", () => {
      expect(tenantRepository).toBeDefined();
      expect(tenantRepository).toBeInstanceOf(TenantRepository);
    });

    describe("create", () => {
      it("should create a new tenant", async () => {
        const mockTenantData = { tenantId: "test-123", name: "Test Tenant" };
        const mockSavedTenant = { ...mockTenantData, _id: "mongo-id" };
        const mockSave = jest.fn().mockResolvedValue(mockSavedTenant);
        const mockTenantModel = jest.fn().mockImplementation(() => ({
          save: mockSave,
        }));
        const mockConnection = {};

        mockMongoManager.getConnection.mockReturnValue(mockConnection as any);
        (getTenantModel as jest.Mock).mockReturnValue(mockTenantModel);

        const result = await tenantRepository.create(mockTenantData);

        expect(getTenantModel).toHaveBeenCalledWith(mockConnection);
        expect(mockTenantModel).toHaveBeenCalledWith(mockTenantData);
        expect(mockSave).toHaveBeenCalled();
        expect(result).toEqual(mockSavedTenant);
      });
    });

    describe("findById", () => {
      it("should find tenant by tenantId", async () => {
        const mockTenantId = "test-123";
        const mockTenant = { tenantId: mockTenantId, name: "Test Tenant" };
        const mockExec = jest.fn().mockResolvedValue(mockTenant);
        const mockFindOne = jest.fn().mockReturnValue({ exec: mockExec });
        const mockTenantModel = { findOne: mockFindOne };
        const mockConnection = {};

        mockMongoManager.getConnection.mockReturnValue(mockConnection as any);
        (getTenantModel as jest.Mock).mockReturnValue(mockTenantModel);

        const result = await tenantRepository.findById(mockTenantId);

        expect(getTenantModel).toHaveBeenCalledWith(mockConnection);
        expect(mockFindOne).toHaveBeenCalledWith({ tenantId: mockTenantId });
        expect(mockExec).toHaveBeenCalled();
        expect(result).toEqual(mockTenant);
      });

      it("should return null when tenant not found", async () => {
        const mockExec = jest.fn().mockResolvedValue(null);
        const mockFindOne = jest.fn().mockReturnValue({ exec: mockExec });
        const mockTenantModel = { findOne: mockFindOne };
        const mockConnection = {};

        mockMongoManager.getConnection.mockReturnValue(mockConnection as any);
        (getTenantModel as jest.Mock).mockReturnValue(mockTenantModel);

        const result = await tenantRepository.findById("non-existent");

        expect(result).toBeNull();
      });
    });

    describe("update", () => {
      it("should update tenant and return updated document", async () => {
        const mockTenantId = "test-123";
        const mockUpdateData = { name: "Updated Name" };
        const mockUpdatedTenant = {
          tenantId: mockTenantId,
          ...mockUpdateData,
        };
        const mockExec = jest.fn().mockResolvedValue(mockUpdatedTenant);
        const mockFindOneAndUpdate = jest
          .fn()
          .mockReturnValue({ exec: mockExec });
        const mockTenantModel = { findOneAndUpdate: mockFindOneAndUpdate };
        const mockConnection = {};

        mockMongoManager.getConnection.mockReturnValue(mockConnection as any);
        (getTenantModel as jest.Mock).mockReturnValue(mockTenantModel);

        const result = await tenantRepository.update(
          mockTenantId,
          mockUpdateData
        );

        expect(getTenantModel).toHaveBeenCalledWith(mockConnection);
        expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
          { tenantId: mockTenantId },
          { $set: mockUpdateData },
          { new: true }
        );
        expect(mockExec).toHaveBeenCalled();
        expect(result).toEqual(mockUpdatedTenant);
      });

      it("should return null when tenant to update not found", async () => {
        const mockExec = jest.fn().mockResolvedValue(null);
        const mockFindOneAndUpdate = jest
          .fn()
          .mockReturnValue({ exec: mockExec });
        const mockTenantModel = { findOneAndUpdate: mockFindOneAndUpdate };
        const mockConnection = {};

        mockMongoManager.getConnection.mockReturnValue(mockConnection as any);
        (getTenantModel as jest.Mock).mockReturnValue(mockTenantModel);

        const result = await tenantRepository.update("non-existent", {
          name: "Test",
        });

        expect(result).toBeNull();
      });
    });
  });
});
