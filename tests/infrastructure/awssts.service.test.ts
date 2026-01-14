import { AWSSTSService } from "../../src/infrastructure/aws/AWSSTSService";
import LOG from "../../src/library/logging";

// Mock AssumeRoleCommand and STSClient
jest.mock("@aws-sdk/client-sts", () => ({
  AssumeRoleCommand: jest.fn(),
  STSClient: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
}));

const { AssumeRoleCommand } = jest.requireMock("@aws-sdk/client-sts");

describe("AWSSTSService", () => {
  let service: AWSSTSService;
  let oldEnv: NodeJS.ProcessEnv;
  let sendMock: jest.Mock;
  let mockSTSClient: { send: jest.Mock };

  beforeAll(() => {
    oldEnv = { ...process.env };
    process.env.AWS_REGION = "us-east-1";
    process.env.AWS_ROLE_ARN = "arn:aws:iam::123456789012:role/test-role";
    process.env.NODE_ENV = "test";
  });

  afterAll(() => {
    process.env = oldEnv;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    sendMock = jest.fn();
    mockSTSClient = { send: sendMock };
    service = new AWSSTSService(mockSTSClient as any);
  });

  it("should return credentials from STS", async () => {
    const now = new Date();
    const expiration = new Date(now.getTime() + 3600 * 1000);
    sendMock.mockResolvedValue({
      Credentials: {
        AccessKeyId: "AKIA_TEST",
        SecretAccessKey: "SECRET_TEST",
        SessionToken: "SESSION_TEST",
        Expiration: expiration,
      },
    });
    const creds = await service.getTemporaryCredentials();
    expect(creds).toEqual({
      accessKeyId: "AKIA_TEST",
      secretAccessKey: "SECRET_TEST",
      sessionToken: "SESSION_TEST",
      expiration,
    });
    // Should cache and return the same object if not expired
    const creds2 = await service.getTemporaryCredentials();
    expect(creds2).toBe(creds);
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it("should throw if no credentials are returned", async () => {
    sendMock.mockResolvedValue({});
    await expect(service.getTemporaryCredentials()).rejects.toThrow("No credentials received from STS");
  });

  it("should log and throw on STS error", async () => {
    const error = new Error("STS failed");
    sendMock.mockRejectedValue(error);
    const logSpy = jest.spyOn(LOG, "error");
    await expect(service.getTemporaryCredentials()).rejects.toThrow("STS failed");
    expect(logSpy).toHaveBeenCalledWith("Error obtaining AWS credentials:", error);
  });

  it("should call AssumeRoleCommand with correct params", async () => {
    const now = new Date();
    const expiration = new Date(now.getTime() + 3600 * 1000);
    sendMock.mockResolvedValue({
      Credentials: {
        AccessKeyId: "AKIA_TEST",
        SecretAccessKey: "SECRET_TEST",
        SessionToken: "SESSION_TEST",
        Expiration: expiration,
      },
    });
    await service.getTemporaryCredentials();
    expect(AssumeRoleCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        RoleArn: process.env.AWS_ROLE_ARN,
        RoleSessionName: expect.stringContaining("MongoDBAtlas-"),
        DurationSeconds: 3600,
      })
    );
  });

  it("should refresh credentials when they are about to expire", async () => {
    const now = new Date();
    // First call - credentials expiring in 4 minutes (within refresh margin)
    const expiringCredentials = {
      Credentials: {
        AccessKeyId: "AKIA_EXPIRING",
        SecretAccessKey: "SECRET_EXPIRING",
        SessionToken: "SESSION_EXPIRING",
        Expiration: new Date(now.getTime() + 4 * 60 * 1000), // 4 minutes from now
      },
    };

    sendMock.mockResolvedValueOnce(expiringCredentials);

    const creds1 = await service.getTemporaryCredentials();
    expect(creds1.accessKeyId).toBe("AKIA_EXPIRING");

    // Second call - should refresh because credentials are within 5-minute margin
    const newCredentials = {
      Credentials: {
        AccessKeyId: "AKIA_NEW",
        SecretAccessKey: "SECRET_NEW",
        SessionToken: "SESSION_NEW",
        Expiration: new Date(now.getTime() + 3600 * 1000), // 1 hour from now
      },
    };

    sendMock.mockResolvedValueOnce(newCredentials);

    const creds2 = await service.getTemporaryCredentials();
    expect(creds2.accessKeyId).toBe("AKIA_NEW");
    expect(sendMock).toHaveBeenCalledTimes(2);
  });

  it("should handle credentials with missing fields", async () => {
    sendMock.mockResolvedValue({
      Credentials: {
        AccessKeyId: "AKIA_TEST",
        SecretAccessKey: "SECRET_TEST",
        // Missing SessionToken
        Expiration: new Date(),
      },
    });

    const creds = await service.getTemporaryCredentials();
    expect(creds.accessKeyId).toBe("AKIA_TEST");
    expect(creds.sessionToken).toBeUndefined();
  });

  it("should handle STS timeout errors", async () => {
    const timeoutError = new Error("Request timeout");
    sendMock.mockRejectedValue(timeoutError);
    const logSpy = jest.spyOn(LOG, "error");

    await expect(service.getTemporaryCredentials()).rejects.toThrow("Request timeout");
    expect(logSpy).toHaveBeenCalledWith("Error obtaining AWS credentials:", timeoutError);
  });

  it("should handle STS access denied errors", async () => {
    const accessDeniedError = new Error("Access denied");
    sendMock.mockRejectedValue(accessDeniedError);
    const logSpy = jest.spyOn(LOG, "error");

    await expect(service.getTemporaryCredentials()).rejects.toThrow("Access denied");
    expect(logSpy).toHaveBeenCalledWith("Error obtaining AWS credentials:", accessDeniedError);
  });

  it("should use default STS client when none is provided", () => {
    // Set all required environment variables for default STSClient creation
    const originalRegion = process.env.AWS_REGION;
    const originalAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const originalSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    process.env.AWS_REGION = "us-west-2";
    process.env.AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE";
    process.env.AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";

    const serviceWithDefaultClient = new AWSSTSService();
    expect(serviceWithDefaultClient).toBeDefined();

    // Clean up - restore original values
    if (originalRegion !== undefined) {
      process.env.AWS_REGION = originalRegion;
    } else {
      delete process.env.AWS_REGION;
    }
    if (originalAccessKeyId !== undefined) {
      process.env.AWS_ACCESS_KEY_ID = originalAccessKeyId;
    } else {
      delete process.env.AWS_ACCESS_KEY_ID;
    }
    if (originalSecretAccessKey !== undefined) {
      process.env.AWS_SECRET_ACCESS_KEY = originalSecretAccessKey;
    } else {
      delete process.env.AWS_SECRET_ACCESS_KEY;
    }
  });

  it("should include correct tags in AssumeRoleCommand", async () => {
    const now = new Date();
    const expiration = new Date(now.getTime() + 3600 * 1000);
    sendMock.mockResolvedValue({
      Credentials: {
        AccessKeyId: "AKIA_TEST",
        SecretAccessKey: "SECRET_TEST",
        SessionToken: "SESSION_TEST",
        Expiration: expiration,
      },
    });

    await service.getTemporaryCredentials();

    expect(AssumeRoleCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        Tags: [
          { Key: "Service", Value: "MongoDBAtlas" },
          { Key: "Environment", Value: "test" },
        ],
      })
    );
  });

  it("should handle expired credentials and refresh", async () => {
    const now = new Date();
    // First call - already expired credentials
    const expiredCredentials = {
      Credentials: {
        AccessKeyId: "AKIA_EXPIRED",
        SecretAccessKey: "SECRET_EXPIRED",
        SessionToken: "SESSION_EXPIRED",
        Expiration: new Date(now.getTime() - 1000), // Already expired
      },
    };

    sendMock.mockResolvedValueOnce(expiredCredentials);

    const creds1 = await service.getTemporaryCredentials();
    expect(creds1.accessKeyId).toBe("AKIA_EXPIRED");

    // Second call - should refresh
    const newCredentials = {
      Credentials: {
        AccessKeyId: "AKIA_NEW",
        SecretAccessKey: "SECRET_NEW",
        SessionToken: "SESSION_NEW",
        Expiration: new Date(now.getTime() + 3600 * 1000),
      },
    };

    sendMock.mockResolvedValueOnce(newCredentials);

    const creds2 = await service.getTemporaryCredentials();
    expect(creds2.accessKeyId).toBe("AKIA_NEW");
    expect(sendMock).toHaveBeenCalledTimes(2);
  });
});
