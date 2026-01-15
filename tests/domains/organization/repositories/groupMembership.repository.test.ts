import "reflect-metadata";
import { GroupMembershipRepository } from "../../../../src/domains/organization/repositories/groupMembership.repository";
import { MongoDBConnectionManager } from "../../../../src/infrastructure/database/mongodbmanager.service";
import { getGroupMembershipModel } from "../../../../src/domains/organization/models/groupMembership.model";
import { GroupMembershipInterface } from "../../../../src/domains/organization/interfaces/groupMembership.interface";

jest.mock("../../../../src/domains/organization/models/groupMembership.model");
jest.mock("../../../../src/infrastructure/database/mongodbmanager.service");

describe("GroupMembershipRepository", () => {
  let repository: GroupMembershipRepository;
  let mockMongoManager: jest.Mocked<MongoDBConnectionManager>;
  let mockGroupMembershipModel: any;
  let mockConnection: any;

  beforeEach(() => {
    mockConnection = {};
    mockMongoManager = {
      getConnection: jest.fn().mockReturnValue(mockConnection),
    } as any;

    mockGroupMembershipModel = jest.fn();
    (getGroupMembershipModel as jest.Mock).mockReturnValue(
      mockGroupMembershipModel
    );

    repository = new GroupMembershipRepository(mockMongoManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create and save a new group membership", async () => {
      const membershipData: Partial<GroupMembershipInterface> = {
        groupId: "group-123",
        userId: "user-456",
      };
      const savedMembership = { ...membershipData, _id: "membership-789" };
      const mockSave = jest.fn().mockResolvedValue(savedMembership);

      mockGroupMembershipModel.mockImplementation((data: any) => ({
        ...data,
        save: mockSave,
      }));

      const result = await repository.create(membershipData);

      expect(getGroupMembershipModel).toHaveBeenCalledWith(mockConnection);
      expect(mockGroupMembershipModel).toHaveBeenCalledWith(membershipData);
      expect(mockSave).toHaveBeenCalled();
      expect(result).toEqual(savedMembership);
    });
  });

  describe("findByGroupAndUser", () => {
    it("should find membership by groupId and userId", async () => {
      const groupId = "group-123";
      const userId = "user-456";
      const foundMembership = { groupId, userId, _id: "membership-789" };
      const mockExec = jest.fn().mockResolvedValue(foundMembership);
      const mockFindOne = jest.fn().mockReturnValue({ exec: mockExec });

      mockGroupMembershipModel.findOne = mockFindOne;

      const result = await repository.findByGroupAndUser(groupId, userId);

      expect(getGroupMembershipModel).toHaveBeenCalledWith(mockConnection);
      expect(mockFindOne).toHaveBeenCalledWith({ groupId, userId });
      expect(mockExec).toHaveBeenCalled();
      expect(result).toEqual(foundMembership);
    });

    it("should return null when membership is not found", async () => {
      const groupId = "group-123";
      const userId = "user-456";
      const mockExec = jest.fn().mockResolvedValue(null);
      const mockFindOne = jest.fn().mockReturnValue({ exec: mockExec });

      mockGroupMembershipModel.findOne = mockFindOne;

      const result = await repository.findByGroupAndUser(groupId, userId);

      expect(result).toBeNull();
    });
  });
});
