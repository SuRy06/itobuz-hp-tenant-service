export interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
  expiration: Date;
}

export interface MongoDBConfig {
  uri: string;
  dbName: string;
  poolSize: number;
  connectionTimeout: number;
  socketTimeout: number;
  serverSelectionTimeout: number;
  heartbeatFrequency: number;
}
