import {
  S3Client,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import Service from '.';
import { checkEnv } from '../utils';
import { ActionArgs, ActionMethod } from '../utils/action';

export default class S3Service extends Service {
  public client: S3Client;
  constructor() {
    super('S3');
    checkEnv(['AWS_ACCESS_KEY', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION'], true);
    this.client = new S3Client({
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      region: process.env.AWS_REGION,
    });
  }

  // TODO implement large object downloads (in chunks)
  // https://docs.aws.amazon.com/code-library/latest/ug/s3_example_s3_Scenario_UsingLargeFiles_section.html

  @ActionMethod({ name: 'S3/GET_OBJECT', type: 'HTTP' })
  public async getObject(args: { bucket: string; key: string } & ActionArgs) {
    const { bucket, key } = args;
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
    return await this.client.send(cmd);
  }

  @ActionMethod({ name: 'S3/DELETE_OBJECT', type: 'HTTP' })
  public async deleteObject(
    args: { bucket: string; key: string } & ActionArgs
  ) {
    const { bucket, key } = args;
    const cmd = new DeleteObjectCommand({ Bucket: bucket, Key: key });
    await this.client.send(cmd);
  }
}

export const s3Service = new S3Service();
