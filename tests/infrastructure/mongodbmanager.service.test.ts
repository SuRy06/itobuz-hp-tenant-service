import { MongoDBConnectionManager } from "../../src/infrastructure/database/mongodbmanager.service";
import mongoose from "mongoose";
import LOG from "../../src/library/logging";
import { AWSSTSService } from "../../src/infrastructure/aws/AWSSTSService";

jest.mock("mongoose");
jest.mock("../../src/library/logging");

const mockClose = jest.fn();
const mockOn = jest.fn();
const mockOnce = jest.fn();
const mockAsPromise = jest.fn().mockResolvedValue(undefined);
const mockConnection = {
  close: mockClose,
  on: mockOn,
  once: mockOnce,
  readyState: 1,
  asPromise: mockAsPromise,
};

const mockCreateConnection = mongoose.createConnection as jest.Mock;
mockCreateConnection.mockImplementation(() => mockConnection);

describe("MongoDBConnectionManager", () => {
  let manager: MongoDBConnectionManager;
  let mockSTS: AWSSTSService;
  let getTemporaryCredentials: jest.Mock;
  let oldEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    oldEnv = { ...process.env };
    process.env.NODE_ENV = "test";
  });

  afterAll(() => {
    process.env = oldEnv;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockAsPromise.mockClear();
    mockCreateConnection.mockImplementation(() => mockConnection);
    getTemporaryCredentials = jest.fn();
    mockSTS = { getTemporaryCredentials } as any;
    manager = new MongoDBConnectionManager(mockSTS);
  });

  it("should connect and set up connection", async () => {
    getTemporaryCredentials.mockResolvedValue({
      accessKeyId: "id",
      secretAccessKey: "secret",
      sessionToken: "token",
      expiration: new Date(Date.now() + 3600 * 1000),
    });
    await manager.connect();
    expect(mockCreateConnection).toHaveBeenCalled();
    expect(manager.getConnection()).toBe(mockConnection);
  });

  it("should throw if getConnection is called before connect", () => {
    manager = new MongoDBConnectionManager(mockSTS);
    expect(() => manager.getConnection()).toThrow("MongoDB connection not initialized");
  });

  it("should close connection on disconnect", async () => {
    getTemporaryCredentials.mockResolvedValue({
      accessKeyId: "id",
      secretAccessKey: "secret",
      sessionToken: "token",
      expiration: new Date(Date.now() + 3600 * 1000),
    });
    await manager.connect();
    await manager.disconnect();
    expect(mockClose).toHaveBeenCalled();
  });
});
