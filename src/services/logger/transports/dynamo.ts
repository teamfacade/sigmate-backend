import {
  DynamoDB,
  PutItemCommandInput,
  AttributeValue,
} from '@aws-sdk/client-dynamodb';
import winston from 'winston';
import Transport from 'winston-transport';

interface WinstonDynamoDBOpts extends Transport.TransportStreamOptions {
  tableName: string;
  dynamoDB: DynamoDB;
}

export default class WinstonDynamoDB extends Transport {
  static checkSetType(s: Set<any>) {
    const setArray = [...s];
    if (setArray.length) {
      const setType = typeof setArray[0];
      setArray.forEach((item) => {
        if (typeof item !== setType) {
          throw new Error(
            'All items in a DynamoDB set must be of the same type.'
          );
        }
      });
      return setType;
    } else {
      return 'undefined';
    }
  }

  static createDynamoDBAttribute(value: any): AttributeValue {
    if (typeof value === 'string') {
      return { S: value };
    } else if (typeof value === 'number') {
      return { N: value.toString() };
    } else if (typeof value === 'boolean') {
      return { BOOL: value };
    } else if (typeof value === 'object') {
      if (value === null) {
        return { NULL: value };
      } else if (value instanceof Array) {
        return { L: WinstonDynamoDB.createDynamoDBList(value) };
      } else if (value instanceof Set) {
        const setType = WinstonDynamoDB.checkSetType(value);
        if (setType === 'string') {
          return { SS: [...value] };
        } else if (setType === 'number') {
          return { NS: [...value].map((n) => n.toString()) };
        } else {
          const err = new Error(
            `createDynamoDBAttribute not implemented for Set<${setType}>`
          );
          err.name = 'NotImplementedError';
          throw err;
        }
      } else if (value) {
        return { M: WinstonDynamoDB.createDynamoDBItem(value) };
      }
    }
    const err = new Error(
      `createDynamoDBAttribute not implemented for type '${typeof value}' (${value})`
    );
    err.name = 'NotImplementedError';
    throw err;
  }

  static createDynamoDBList(arr: Array<any>): AttributeValue[] {
    return arr.map((item) => WinstonDynamoDB.createDynamoDBAttribute(item));
  }

  static createDynamoDBItem(
    obj: Record<string, any>
  ): Record<string, AttributeValue> {
    const item: Record<string, AttributeValue> = {};
    for (const key in obj) {
      if (obj[key] !== undefined) {
        item[key] = WinstonDynamoDB.createDynamoDBAttribute(obj[key]);
      }
    }
    return item;
  }

  tableName: string;
  dynamoDB: DynamoDB;

  constructor(opts: WinstonDynamoDBOpts) {
    super(opts);
    this.tableName = opts.tableName;
    this.dynamoDB = opts.dynamoDB;
  }

  log(info: sigmate.Logger.DynamoInfo, callback: winston.LogCallback) {
    const item: Record<string, AttributeValue> =
      WinstonDynamoDB.createDynamoDBItem(info);
    const args: PutItemCommandInput = {
      TableName: this.tableName,
      Item: item,
    };
    const dynamoDB = this.dynamoDB;

    dynamoDB
      .putItem(args)
      .then(() => {
        this.emit('logged', info);
        callback && callback();
      })
      .catch((err) => {
        callback && callback(err);
      });
  }
}
