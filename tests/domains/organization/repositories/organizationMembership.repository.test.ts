import { OrganizationMembershipRepository } from "../../../../src/domains/organization/repositories/organizationMembership.repository";
import { MongoDBConnectionManager } from "../../../../src/infrastructure/database/mongodbmanager.service";
import { getOrganizationMembershipModel } from "../../../../src/domains/organization/models/organizationMembership.model";
import { OrganizationMembershipInterface } from "../../../../src/domains/organization/interfaces/organizationMembership.interface";

jest.mock(
  "../../../../src/domains/organization/models/organizationMembership.model"
);
jest.mock("../../../infrastructure/database/mongodbmanager.service");

describe("OrganizationMembershipRepository", () => {
  let repository: OrganizationMembershipRepository;
  let mockMongoManager: jest.Mocked<MongoDBConnectionManager>;
  let mockConnection: any;
  let mockModel: any;

  beforeEach(() => {
    mockConnection = {};
    mockMongoManager = {
      getConnection: jest.fn().mockReturnValue(mockConnection),
    } as any;

    mockModel = {
      findOne: jest.fn(),
      find: jest.fn(),
    };

    (getOrganizationMembershipModel as jest.Mock).mockReturnValue(mockModel);

    repository = new OrganizationMembershipRepository(mockMongoManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create and save a new organization membership", async () => {
      const membershipData: Partial<OrganizationMembershipInterface> = {
        orgId: "org123",
        userId: "user456",
      };

      const savedMembership = { ...membershipData, _id: "membership789" };
      const mockSave = jest.fn().mockResolvedValue(savedMembership);
      const mockConstructor = jest.fn().mockImplementation(() => ({
        save: mockSave,
      }));

      (getOrganizationMembershipModel as jest.Mock).mockReturnValue(
        mockConstructor
      );

      const result = await repository.create(membershipData);

      expect(mockMongoManager.getConnection).toHaveBeenCalled();
      expect(getOrganizationMembershipModel).toHaveBeenCalledWith(
        mockConnection
      );
      expect(mockConstructor).toHaveBeenCalledWith(membershipData);
      expect(mockSave).toHaveBeenCalled();
      expect(result).toEqual(savedMembership);
    });
  });

  describe("findByOrgAndUser", () => {
    it("should find membership by orgId and userId", async () => {
      const orgId = "org123";
      const userId = "user456";
      const mockMembership = { orgId, userId, _id: "membership789" };
      const mockExec = jest.fn().mockResolvedValue(mockMembership);

      mockModel.findOne.mockReturnValue({ exec: mockExec });

      const result = await repository.findByOrgAndUser(orgId, userId);

      expect(mockMongoManager.getConnection).toHaveBeenCalled();
      expect(getOrganizationMembershipModel).toHaveBeenCalledWith(
        mockConnection
      );
      expect(mockModel.findOne).toHaveBeenCalledWith({ orgId, userId });
      expect(mockExec).toHaveBeenCalled();
      expect(result).toEqual(mockMembership);
    });

    it("should return null when membership not found", async () => {
      const orgId = "org123";
      const userId = "user456";
      const mockExec = jest.fn().mockResolvedValue(null);

      mockModel.findOne.mockReturnValue({ exec: mockExec });

      const result = await repository.findByOrgAndUser(orgId, userId);

      expect(result).toBeNull();
    });
  });

  describe("findByOrg", () => {
    it("should find all memberships by orgId", async () => {
      const orgId = "org123";
      const mockMemberships = [
        { orgId, userId: "user1", _id: "membership1" },
        { orgId, userId: "user2", _id: "membership2" },
      ];
      const mockExec = jest.fn().mockResolvedValue(mockMemberships);

      mockModel.find.mockReturnValue({ exec: mockExec });

      const result = await repository.findByOrg(orgId);

      expect(mockMongoManager.getConnection).toHaveBeenCalled();
      expect(getOrganizationMembershipModel).toHaveBeenCalledWith(
        mockConnection
      );
      expect(mockModel.find).toHaveBeenCalledWith({ orgId });
      expect(mockExec).toHaveBeenCalled();
      expect(result).toEqual(mockMemberships);
    });

    it("should return empty array when no memberships found", async () => {
      const orgId = "org123";
      const mockExec = jest.fn().mockResolvedValue([]);

      mockModel.find.mockReturnValue({ exec: mockExec });

      const result = await repository.findByOrg(orgId);

      expect(result).toEqual([]);
    });
  });
});
