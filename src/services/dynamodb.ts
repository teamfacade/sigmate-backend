import Service from '.';
import {
  AttributeValue,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  BatchWriteItemCommand,
  BatchWriteItemInput,
  QueryCommand,
  QueryCommandOutput,
  WriteRequest,
  BatchWriteItemCommandOutput,
  Capacity,
  ConsumedCapacity,
} from '@aws-sdk/client-dynamodb';
import { NodeHttpHandler } from '@aws-sdk/node-http-handler';
import isInt from 'validator/lib/isInt';
import { Agent } from 'http';
import { DateTime } from 'luxon';
import Action, { ActionArgs, ActionMethod } from '../utils/action';
import { waitFor } from '../utils';
import { forEach, mapValues } from 'lodash';

type ValueLike =
  | string
  | number
  | null
  | boolean
  | Array<ValueLike>
  | Set<string>
  | Set<number>
  | Record<string, unknown>;

type TableName = string;
type IndexName = string;
type BatchWriteRequestObjects = Record<
  TableName,
  {
    PutRequest?: { Item: Record<string, unknown> };
    DeleteRequest?: { Key: Record<string, unknown> };
  }[]
>;

export type DynamoQueryArgs = {
  tableName: string;
  keyConditionExpression: string;
  indexName?: string;
  expressionAttributeValues?: Record<string, unknown>;
  exclusiveStartKey?: Record<string, AttributeValue>;
  ascending?: boolean;
  select?: QuerySelectOption;
  /**
   * Possible values:
   * * `true`, `0`: Fetches all items that meet the query conditions. Performs multiple query requests if necessary
   * * Positive integer: Maximum number of items to evaluate in query request
   * * `undefined`: Evaluate up to 1MB of items
   */
  limit?: boolean | number;
  returnConsumedCapacity?: ConsumedCapacityOption;
};

type QuerySelectOption =
  | 'ALL_ATTRIBUTES'
  | 'ALL_PROJECTED_ATTRIBUTES'
  | 'COUNT'
  | 'SPECIFIC_ATTRIBUTES';
type ConsumedCapacityOption = 'INDEXES' | 'TOTAL' | 'NONE';
type ConsumedCapacitySummary = {
  CapacityUnits?: number;
  ReadCapacityUnits?: number;
  WriteCapacityUnits?: number;
  Tables?: Record<TableName, Capacity>;
  GlobalSecondaryIndexes?: Record<IndexName, Capacity>;
  LocalSecondaryIndexes?: Record<IndexName, Capacity>;
};
type DynamoDBAnalyticsDTO = {
  command:
    | 'GetItem'
    | 'PutItem'
    | 'DeleteItem'
    | 'UpdateItem'
    | 'BatchWriteItem'
    | 'Query';
  commandCount: number;
  count?: number;
  scannedCount?: number;
  capacity?: ConsumedCapacitySummary;
};

export default class DynamoDBService extends Service {
  protected static uninterruptibleTasks: Set<Promise<unknown>> = new Set();
  // BatchWriteItem can contain up to 25 put/delete requests
  private static BATCH_LIMIT = 25;
  /** Initial delay in milliseconds to wait for in case of failed requests in BatchWrite */
  private static BATCH_DELAY = 250;
  /** Stop increasing the delay after this   */
  private static BATCH_DELAY_THRSH = 250 * 250 ** 10; // 4 minutes (256 seconds)
  /** Key to use for logging Dynamo DB analytics in the log  */
  private static LOG_KEY = 'awsDyanmo';

  __client?: DynamoDBClient;
  get client() {
    if (!this.__client) throw new Error('DynamoDB client not initalized');
    return this.__client;
  }

  constructor() {
    super('DynamoDB');
  }

  @Service.Uninterruptible()
  @ActionMethod({
    name: 'DYNAMO/GET_ITEM',
    type: 'AWS',
  })
  public async getItem(
    args: {
      key: Record<string, unknown>;
      tableName: string;
      returnConsumedCapacity?: ConsumedCapacityOption;
    } & ActionArgs
  ) {
    this.checkAvailable();
    const {
      key,
      tableName: TableName,
      returnConsumedCapacity: ReturnConsumedCapacity = 'INDEXES',
      action,
    } = args;
    const cmd = new GetItemCommand({
      TableName,
      Key: this.generateItem(key),
      ReturnConsumedCapacity,
    });
    const output = await this.client.send(cmd);

    const { Item, ConsumedCapacity } = output;
    const capacity: ConsumedCapacitySummary = {};
    if (output.ConsumedCapacity) {
      this.updateConsumedCapacitySummary(capacity, ConsumedCapacity);
    }
    this.setActionAnalytics(action, {
      command: 'GetItem',
      commandCount: 1,
      capacity,
    });

    return {
      item: Item ? this.generateObject(Item) : undefined,
      capacity,
      output,
    };
  }

  @Service.Uninterruptible()
  @ActionMethod({
    name: 'DYNAMO/QUERY',
    type: 'AWS',
  })
  public async query(args: DynamoQueryArgs & ActionArgs) {
    this.checkAvailable();
    const {
      tableName: TableName,
      indexName: IndexName,
      keyConditionExpression: KeyConditionExpression,
      expressionAttributeValues,
      select: Select,
      limit,
      returnConsumedCapacity: ReturnConsumedCapacity = 'INDEXES',
      ascending,
      action,
    } = args;
    let { exclusiveStartKey: ExclusiveStartKey } = args;

    // Load all "pages"
    let loadAll = false;
    let Limit: number | undefined = undefined;
    if (typeof limit === 'boolean' && !limit) {
      loadAll = true;
    } else if (typeof limit === 'number') {
      if (limit > 0) {
        Limit = limit;
      } else if (limit === 0) {
        loadAll = true;
      } else {
        throw new Error('Limit must be either a boolean or a positive integer');
      }
    }
    const ExpressionAttributeValues = mapValues(
      expressionAttributeValues,
      (v) => this.generateAttribute(v)
    );
    const outputs: QueryCommandOutput[] = [];
    do {
      const output = await this.client.send(
        new QueryCommand({
          TableName,
          IndexName,
          KeyConditionExpression,
          ExpressionAttributeValues,
          ExclusiveStartKey,
          Select,
          Limit,
          ReturnConsumedCapacity,
          ScanIndexForward: ascending,
        })
      );
      outputs.push(output);
      ExclusiveStartKey = output.LastEvaluatedKey;
      // If limit is not set, repeatedly call query to obtain all items
      // until all items have been fetched
    } while (loadAll && ExclusiveStartKey);

    const items: Record<string, unknown>[] = [];
    let count = 0;
    let scannedCount = 0;
    const consumedCapacitySummary: ConsumedCapacitySummary = {};
    outputs.forEach((output) => {
      if (output.Items) {
        items.concat(output.Items.map((i) => this.generateObject(i)));
      }
      if (output.Count) count += output.Count;
      if (output.ScannedCount) scannedCount += output.ScannedCount;
      if (output.ConsumedCapacity) {
        this.updateConsumedCapacitySummary(
          consumedCapacitySummary,
          output.ConsumedCapacity
        );
      }
    });

    this.setActionAnalytics(action, {
      command: 'Query',
      commandCount: outputs.length,
      count,
      scannedCount,
      capacity: consumedCapacitySummary,
    });

    return {
      items,
      count,
      scannedCount,
      capacity: consumedCapacitySummary,
      outputs,
    };
  }

  @Service.Uninterruptible()
  @ActionMethod({
    name: 'DYNAMO/PUT_ITEM',
    type: 'AWS',
  })
  public async putItem(
    args: {
      value: Record<string, unknown>;
      tableName: string;
      returnConsumedCapacity?: ConsumedCapacityOption;
    } & ActionArgs
  ) {
    this.checkAvailable();
    const {
      value,
      tableName,
      returnConsumedCapacity: ReturnConsumedCapacity = 'INDEXES',
      action,
    } = args;
    const cmd = new PutItemCommand({
      TableName: tableName,
      Item: this.generateItem(value),
      ReturnConsumedCapacity,
    });
    const output = await this.client.send(cmd);

    const capacity: ConsumedCapacitySummary = {};
    if (output.ConsumedCapacity) {
      this.updateConsumedCapacitySummary(capacity, output.ConsumedCapacity);
    }

    this.setActionAnalytics(action, {
      command: 'PutItem',
      commandCount: 1,
      capacity,
    });

    return { capacity, output };
  }

  @Service.Uninterruptible()
  @ActionMethod({
    name: 'DYNAMO/BATCH_WRITE',
    type: 'AWS',
  })
  public async batchWriteItem(
    args: {
      items: BatchWriteRequestObjects;
      returnConsumedCapacity?: ConsumedCapacityOption;
    } & ActionArgs
  ) {
    const {
      items,
      returnConsumedCapacity: ReturnConsumedCapacity,
      action,
    } = args;
    const BATCH_LIMIT = DynamoDBService.BATCH_LIMIT;
    const BATCH_DELAY_THRSH = DynamoDBService.BATCH_DELAY_THRSH;

    // Break up large number of requests into batches
    // DynamoDB only accepts up to 25 requests in a single BatchWrite command
    const batches: BatchWriteRequestObjects[] = [];

    // Keep track of total number of requests
    let count = 0;
    let batchCount = 0;
    forEach(items, (requests, tableName) => {
      requests.forEach((request) => {
        batchCount = Math.floor(count / BATCH_LIMIT);
        if (!batches[batchCount]) {
          batches[batchCount] = {};
        }
        if (!batches[batchCount][tableName]) {
          batches[batchCount][tableName] = [];
        }
        batches[batchCount][tableName].push(request);
        count++;
      });
    });

    let batch = batches.pop();
    let RequestItems: Record<string, WriteRequest[]> | undefined;
    const outputs: BatchWriteItemCommandOutput[] = [];
    const capacity: ConsumedCapacitySummary = {};
    while (batch) {
      RequestItems = this.generateBatchWriteItems(batch);
      let delayMs = DynamoDBService.BATCH_DELAY;

      // For each batch, retry BatchWrite until all items have been processed
      while (RequestItems) {
        const output = await this.client.send(
          new BatchWriteItemCommand({
            RequestItems,
            ReturnConsumedCapacity,
          })
        );
        output.ConsumedCapacity?.forEach((c) => {
          this.updateConsumedCapacitySummary(capacity, c);
        });
        RequestItems = output.UnprocessedItems;
        if (RequestItems && Object.keys(RequestItems).length === 0) {
          RequestItems = undefined;
        }
        outputs.push(output);
        if (RequestItems) {
          // If failed, wait for a delay
          await waitFor(delayMs);
          // Exponentially increase delay
          if (delayMs < BATCH_DELAY_THRSH) delayMs *= 2;
        }
      }

      // Move onto the next batch
      batch = batches.pop();
    }

    this.setActionAnalytics(action, {
      command: 'BatchWriteItem',
      commandCount: outputs.length,
      capacity,
    });

    return { outputs, capacity };
  }

  public generateObject(item: Record<string, AttributeValue>) {
    const obj: Record<string, unknown> = {};
    for (const k in item) {
      obj[k] = this.generateValue(item[k]);
    }
    return obj;
  }

  public generateValue(aValue: AttributeValue): ValueLike {
    if (aValue.S) {
      return aValue.S;
    } else if (aValue.N) {
      if (isInt(aValue.N)) {
        return Number.parseInt(aValue.N);
      } else {
        return Number.parseFloat(aValue.N);
      }
    } else if (aValue.NULL !== undefined) {
      return null;
    } else if (aValue.BOOL !== undefined) {
      return aValue.BOOL;
    } else if (aValue.L) {
      return aValue.L.map((i) => this.generateValue(i));
    } else if (aValue.SS) {
      return new Set(aValue.SS);
    } else if (aValue.NS) {
      return new Set(
        aValue.NS.map((i) => {
          return isInt(i) ? Number.parseInt(i) : Number.parseFloat(i);
        })
      );
    } else if (aValue.M) {
      const o: Record<string, unknown> = {};
      Object.keys(aValue.M).forEach((k) => {
        o[k] = this.generateValue(aValue.M[k]);
      });
      return o;
    }
    throw new Error('DynamoDB attribute type not implemented');
  }

  public generateBatchWriteItems(
    objects: BatchWriteRequestObjects
  ): BatchWriteItemInput['RequestItems'] {
    const requestItems: BatchWriteItemInput['RequestItems'] = {};
    for (const tableName in objects) {
      requestItems[tableName] = objects[tableName].map((i) => ({
        PutRequest: i.PutRequest?.Item
          ? { Item: this.generateItem(i.PutRequest.Item) }
          : undefined,
        DeleteRequest: i.DeleteRequest?.Key
          ? { Key: this.generateItem(i.DeleteRequest.Key) }
          : undefined,
      }));
    }
    return requestItems;
  }

  public generateItem(value: Record<string, unknown>) {
    const item: Record<string, AttributeValue> = {};
    for (const k in value) {
      item[k] = this.generateAttribute(value[k]);
    }
    return item;
  }

  public generateAttribute(value: unknown): AttributeValue {
    if (typeof value === 'string') {
      return { S: value };
    } else if (typeof value === 'number') {
      return { N: value.toString() };
    } else if (typeof value === 'boolean') {
      return { BOOL: value };
    } else if (typeof value === 'object') {
      if (value === null) {
        return { NULL: true };
      } else if (value instanceof Array) {
        return {
          L: value.map((i) => this.generateAttribute(i)),
        };
      } else if (value instanceof Set) {
        let setType = '';
        value.forEach((i) => {
          if (setType && typeof i !== setType) {
            throw new Error(
              'All items in a DynamoDB set attribute must be of the same type'
            );
          }
          setType = typeof i;
        });
        switch (setType) {
          case 'string':
            return { SS: [...value] };
          case 'number':
            return { NS: [...value].map((n) => String(n)) };
          default:
            throw new Error(`Unsupported set item type: ${setType}`);
        }
      } else if (value instanceof Date) {
        return { S: DateTime.fromJSDate(value).setZone('utc').toISO() };
      } else if (value instanceof DateTime) {
        return { S: value.toISO() };
      } else if (value) {
        const attribute: AttributeValue = { M: {} };
        for (const k in value) {
          const v = value[k as keyof typeof value];
          if (v !== undefined) attribute.M[k] = this.generateAttribute(v);
        }
        return attribute;
      }
    }
    throw new Error(
      `createAttribute not implemented for type "${typeof value}"`
    );
  }

  private setActionAnalytics(
    action: Action | undefined,
    dto: DynamoDBAnalyticsDTO
  ) {
    action?.setLogData(DynamoDBService.LOG_KEY, dto);
  }

  private updateConsumedCapacitySummary(
    summary: ConsumedCapacitySummary,
    consumedCapacity: ConsumedCapacity | undefined
  ) {
    if (!consumedCapacity) return;
    const {
      CapacityUnits,
      ReadCapacityUnits,
      WriteCapacityUnits,
      Table,
      TableName,
      GlobalSecondaryIndexes,
      LocalSecondaryIndexes,
    } = consumedCapacity;
    if (CapacityUnits) {
      if (!summary.CapacityUnits) {
        summary.CapacityUnits = 0;
      }
      summary.CapacityUnits += CapacityUnits;
    }

    if (ReadCapacityUnits) {
      if (!summary.ReadCapacityUnits) {
        summary.ReadCapacityUnits = 0;
      }
      summary.ReadCapacityUnits += ReadCapacityUnits;
    }

    if (WriteCapacityUnits) {
      if (!summary.WriteCapacityUnits) {
        summary.WriteCapacityUnits = 0;
      }
      summary.WriteCapacityUnits += WriteCapacityUnits;
    }

    if (Table && TableName) {
      if (!summary.Tables) {
        summary.Tables = {};
      }
      if (summary.Tables[TableName]) {
        const table = summary.Tables[TableName];
        forEach(Table, (v, key) => {
          const k = key as keyof Capacity;
          if (v) table[k] = (table[k] || 0) + v;
        });
      } else {
        summary.Tables[TableName] = Table;
      }
    }

    if (GlobalSecondaryIndexes) {
      forEach(GlobalSecondaryIndexes, (capacity, indexName) => {
        if (!summary.GlobalSecondaryIndexes) {
          summary.GlobalSecondaryIndexes = {};
        }
        if (summary.GlobalSecondaryIndexes[indexName]) {
          const index = summary.GlobalSecondaryIndexes[indexName];
          forEach(capacity, (v, key) => {
            const k = key as keyof Capacity;
            if (v) index[k] = (index[k] || 0) + v;
          });
        } else {
          summary.GlobalSecondaryIndexes[indexName] = capacity;
        }
      });
    }

    if (LocalSecondaryIndexes) {
      forEach(LocalSecondaryIndexes, (capacity, indexName) => {
        if (!summary.LocalSecondaryIndexes) {
          summary.LocalSecondaryIndexes = {};
        }
        if (summary.LocalSecondaryIndexes[indexName]) {
          const index = summary.LocalSecondaryIndexes[indexName];
          forEach(capacity, (v, key) => {
            const k = key as keyof Capacity;
            if (v) index[k] = (index[k] || 0) + v;
          });
        } else {
          summary.LocalSecondaryIndexes[indexName] = capacity;
        }
      });
    }
  }

  async start() {
    this.setStatus('STARTING');
    this.__client = new DynamoDBClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      // Prevent re-using TCP connections
      // https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/node-reusing-connections.html
      requestHandler: new NodeHttpHandler({
        httpAgent: new Agent({ keepAlive: false }),
      }),
    });
    this.setStatus('AVAILABLE');
  }

  async close() {
    await this.waitTasks();
    this.client.destroy();
  }
}

export const dynamodb = new DynamoDBService();
