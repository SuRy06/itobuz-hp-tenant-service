import "reflect-metadata";
import { OrganizationRepository } from "../../../../src/domains/organization/repositories/organization.repository";
import { MongoDBConnectionManager } from "../../../../src/infrastructure/database/mongodbmanager.service";
import {
  OrganizationTypeEnum,
  OrganizationStatusEnum,
} from "../../../../src/types/config";

describe("OrganizationRepository", () => {
  let organizationRepository: OrganizationRepository;
  let mockMongoManager: jest.Mocked<MongoDBConnectionManager>;

  beforeEach(() => {
    mockMongoManager = {
      getConnection: jest.fn(),
    } as any;

    organizationRepository = new OrganizationRepository(mockMongoManager);
  });

  describe("create", () => {
    it("should call getConnection from MongoDB manager", async () => {
      // Arrange
      const mockSave = jest.fn().mockResolvedValue({
        orgId: "org_123",
        name: "Test Org",
        type: OrganizationTypeEnum.DIRECT,
        status: OrganizationStatusEnum.ACTIVE,
        ownerUserId: "user123",
      });

      const mockModel = jest.fn().mockImplementation(() => ({
        save: mockSave,
      }));

      const mockConnection = {
        model: jest.fn().mockReturnValue(mockModel),
      };

      mockMongoManager.getConnection.mockReturnValue(mockConnection as any);

      const organizationData = {
        orgId: "org_123",
        name: "Test Org",
        type: OrganizationTypeEnum.DIRECT,
        status: OrganizationStatusEnum.ACTIVE,
        ownerUserId: "user123",
      };

      // Act
      await organizationRepository.create(organizationData);

      // Assert
      expect(mockMongoManager.getConnection).toHaveBeenCalled();
    });
  });
});
