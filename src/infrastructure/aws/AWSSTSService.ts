import { injectable } from "tsyringe";
import { AWSCredentials } from "./types";
import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
import LOG from "../../library/logging";

@injectable()
export class AWSSTSService {
  private readonly stsClient: STSClient;
  private credentials: AWSCredentials | null = null;
  private readonly REFRESH_MARGIN_MS = 5 * 60 * 1000; // 5 minutes

  constructor(stsClient?: STSClient) {
    this.stsClient =
      stsClient ||
      new STSClient({
        region: process.env.AWS_REGION,
        maxAttempts: 3,
        retryMode: "standard",
      });
  }

  async getTemporaryCredentials(): Promise<AWSCredentials> {
    try {
      if (this.credentials && this.credentials.expiration > new Date(Date.now() + this.REFRESH_MARGIN_MS)) {
        return this.credentials;
      }

      const command = new AssumeRoleCommand({
        RoleArn: process.env.AWS_ROLE_ARN,
        RoleSessionName: `MongoDBAtlas-${Date.now()}`,
        DurationSeconds: 3600, // 1 hour
        Tags: [
          { Key: "Service", Value: "MongoDBAtlas" },
          { Key: "Environment", Value: process.env.NODE_ENV ?? "development" },
        ],
      });

      const response = await this.stsClient.send(command);

      if (!response.Credentials) {
        throw new Error("No credentials received from STS");
      }

      this.credentials = {
        accessKeyId: response.Credentials.AccessKeyId!,
        secretAccessKey: response.Credentials.SecretAccessKey!,
        sessionToken: response.Credentials.SessionToken!,
        expiration: response.Credentials.Expiration!,
      };

      return this.credentials;
    } catch (error) {
      LOG.error("Error obtaining AWS credentials:", error);
      throw error;
    }
  }
}
