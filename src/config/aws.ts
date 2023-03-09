import { CloudWatchLogsClientConfig } from '@aws-sdk/client-cloudwatch-logs';
import { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import { NodeHttpHandler } from '@aws-sdk/node-http-handler';
import { Agent } from 'http';

import dotenv from 'dotenv';
dotenv.config();

type AWSConfigs = {
  cloudWatchLogs: Record<string, CloudWatchLogsClientConfig>;
  dynamoDB: Record<string, DynamoDBClientConfig>;
};

const CONFIG_AWS: AWSConfigs = {
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
      endpoint: process.env.AWS_DYNAMODB_ENDPOINT,
      // https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/node-reusing-connections.html
      requestHandler: new NodeHttpHandler({
        httpAgent: new Agent({ keepAlive: false }),
      }),
    },
  },
};

export default CONFIG_AWS;
