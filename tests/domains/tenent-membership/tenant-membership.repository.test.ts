import "reflect-metadata";
import { TenantMembershipRepository } from "../../../src/domains/membership/respositories/tenant-membership.repository";
import { MongoDBConnectionManager } from "../../../src/infrastructure/database/mongodbmanager.service";
import { getTenantMembershipModel } from "../../../src/domains/membership/models/tenant-membership.model";

jest.mock("../../../src/domains/membership/models/tenant-membership.model.ts");

describe("TenantMembershipRepository", () => {
  let repository: TenantMembershipRepository;
  let mongoManager: jest.Mocked<MongoDBConnectionManager>;
  let mockConnection: any;
  let mockModel: any;

  beforeEach(() => {
    mockModel = {
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };

    mockConnection = {};

    mongoManager = {
      getConnection: jest.fn().mockReturnValue(mockConnection),
    } as any;

    (getTenantMembershipModel as jest.Mock).mockReturnValue(mockModel);

    repository = new TenantMembershipRepository(mongoManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("updateRolesAtomic", () => {
    it("should add and remove roles atomically and increment membershipVersion", async () => {
      const updatedMembership = {
        membershipId: "m1",
        tenantId: "t1",
        userId: "u1",
        roles: ["ADMIN"],
        membershipVersion: 2,
      };

      mockModel.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue(updatedMembership),
      });

      const result = await repository.updateRolesAtomic({
        tenantId: "t1",
        userId: "u1",
        add: ["ADMIN"],
        remove: ["USER"],
      });

      expect(getTenantMembershipModel).toHaveBeenCalledWith(mockConnection);

      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        {
          tenantId: "t1",
          userId: "u1",
        },
        {
          $inc: { membershipVersion: 1 },
          $addToSet: {
            roles: { $each: ["ADMIN"] },
          },
          $pullAll: {
            roles: ["USER"],
          },
        },
        { new: true }
      );

      expect(result).toEqual(updatedMembership);
    });

    it("should only increment version when add and remove are empty", async () => {
      mockModel.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await repository.updateRolesAtomic({
        tenantId: "t1",
        userId: "u1",
        add: [],
        remove: [],
      });

      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        {
          tenantId: "t1",
          userId: "u1",
        },
        {
          $inc: { membershipVersion: 1 },
        },
        { new: true }
      );
    });
  });
  describe("findByTenantAndUser", () => {
    it("should find membership by tenantId and userId", async () => {
      const membership = {
        tenantId: "t1",
        userId: "u1",
        roles: ["ADMIN"],
      };

      mockModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(membership),
      });

      const result = await repository.findByTenantAndUser("t1", "u1");

      expect(getTenantMembershipModel).toHaveBeenCalledWith(mockConnection);
      expect(mockModel.findOne).toHaveBeenCalledWith({
        tenantId: "t1",
        userId: "u1",
      });
      expect(result).toEqual(membership);
    });

    it("should return null if membership not found", async () => {
      mockModel.findOne.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.findByTenantAndUser("t1", "u1");

      expect(result).toBeNull();
    });
  });

  describe("increaseVersion", () => {
    it("should increment membershipVersion and return updated membership", async () => {
      const updatedMembership = {
        tenantId: "t1",
        userId: "u1",
        membershipVersion: 2,
      };

      mockModel.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue(updatedMembership),
      });

      const result = await repository.increaseVersion("t1", "u1");

      expect(getTenantMembershipModel).toHaveBeenCalledWith(mockConnection);

      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { tenantId: "t1", userId: "u1" },
        { $inc: { membershipVersion: 1 } },
        { new: true }
      );

      expect(result).toEqual(updatedMembership);
    });

    it("should throw error if membership not found while bumping version", async () => {
      mockModel.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      await expect(repository.increaseVersion("t1", "u1")).rejects.toThrow(
        "Membership not found while bumping version"
      );
    });
  });
  describe("updateStatus", () => {
    it("should update membership status and increment version", async () => {
      const updatedMembership = {
        tenantId: "t1",
        userId: "u1",
        status: "SUSPENDED",
        membershipVersion: 2,
      };

      mockModel.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue(updatedMembership),
      });

      const result = await repository.updateStatus("t1", "u1", "SUSPENDED");

      expect(getTenantMembershipModel).toHaveBeenCalledWith(mockConnection);

      expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(
        { tenantId: "t1", userId: "u1" },
        {
          $set: { status: "SUSPENDED" },
          $inc: { membershipVersion: 1 },
        },
        { new: true }
      );

      expect(result).toEqual(updatedMembership);
    });

    it("should return null if membership is not found", async () => {
      mockModel.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

      const result = await repository.updateStatus("t1", "u1", "REVOKED");

      expect(result).toBeNull();
    });
  });
});
