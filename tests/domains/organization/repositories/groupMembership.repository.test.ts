import "reflect-metadata";
import { GroupMembershipRepository } from "../../../../src/domains/organization/repositories/groupMembership.repository";
import * as modelModule from "../../../../src/domains/organization/models/groupMembership.model";
import { MongoDBConnectionManager } from "../../../../src/infrastructure/database/mongodbmanager.service";

jest.mock("../../../../src/domains/organization/models/groupMembership.model.ts");

describe("GroupMembershipRepository", () => {
  const mockedGetModel = modelModule.getGroupMembershipModel as jest.Mock;

  const fakeConnection = Symbol("conn");
  const fakeMongoManager = {
    getConnection: jest.fn().mockReturnValue(fakeConnection),
  } as unknown as MongoDBConnectionManager;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("create - constructs model, calls save and returns saved document", async () => {
    const membershipData = { groupId: "g1", userId: "u1", role: "member" };
    const savedDoc = { ...membershipData, _id: "savedId" };

    const saveMock = jest.fn().mockResolvedValue(savedDoc);
    const ModelConstructorMock = jest.fn().mockImplementation((data) => ({
      ...data,
      save: saveMock,
    }));

    mockedGetModel.mockReturnValue(ModelConstructorMock);

    const repo = new GroupMembershipRepository(fakeMongoManager);
    const result = await repo.create(membershipData);

    expect(mockedGetModel).toHaveBeenCalled();
    expect(ModelConstructorMock).toHaveBeenCalledWith(membershipData);
    expect(saveMock).toHaveBeenCalled();
    expect(result).toEqual(savedDoc);
  });

  test("findByGroupAndUser - calls findOne with filters and returns document", async () => {
    const groupId = "g2";
    const userId = "u2";
    const foundDoc = { groupId, userId, role: "admin" };

    const execMock = jest.fn().mockResolvedValue(foundDoc);
    const findOneMock = jest.fn().mockReturnValue({ exec: execMock });

    mockedGetModel.mockReturnValue({ findOne: findOneMock });

    const repo = new GroupMembershipRepository(fakeMongoManager);
    const result = await repo.findByGroupAndUser(groupId, userId);

    expect(mockedGetModel).toHaveBeenCalled();
    expect(findOneMock).toHaveBeenCalledWith({ groupId, userId });
    expect(execMock).toHaveBeenCalled();
    expect(result).toEqual(foundDoc);
  });

  test("findByGroupAndUser - returns null when not found", async () => {
    const groupId = "no";
    const userId = "one";

    const execMock = jest.fn().mockResolvedValue(null);
    const findOneMock = jest.fn().mockReturnValue({ exec: execMock });

    mockedGetModel.mockReturnValue({ findOne: findOneMock });

    const repo = new GroupMembershipRepository(fakeMongoManager);
    const result = await repo.findByGroupAndUser(groupId, userId);

    expect(result).toBeNull();
    expect(findOneMock).toHaveBeenCalledWith({ groupId, userId });
  });
});
