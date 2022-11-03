import { CloudWatchLogsClientConfig } from '@aws-sdk/client-cloudwatch-logs';
import { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import dotenv from 'dotenv';
dotenv.config();

type AWSConfigs = {
  cloudWatchLogs: Record<string, CloudWatchLogsClientConfig>;
  dynamoDB: Record<string, DynamoDBClientConfig>;
};

const awsConfig: AWSConfigs = {
  cloudWatchLogs: {
    logger: {
      region: 'ap-northeast-2',
      credentials: {
        accessKeyId: process.env.AWS_LOGGER_ACCESS_KEY,
        secretAccessKey: process.env.AWS_LOGGER_SECRET_ACCESS_KEY,
      },
    },
  },
  dynamoDB: {
    logger: {
      region: 'ap-northeast-2',
      credentials: {
        accessKeyId: process.env.AWS_LOGGER_ACCESS_KEY,
        secretAccessKey: process.env.AWS_LOGGER_SECRET_ACCESS_KEY,
      },
    },
  },
};

export default awsConfig;
