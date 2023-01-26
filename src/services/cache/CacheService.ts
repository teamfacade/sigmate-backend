import Service from '..';
import DatabaseService from '../DatabaseService';
import CacheError from '../errors/CacheError';
import LoggerService, { logger } from '../logger/LoggerService';
import RedisService from './RedisService';

export type CacheKeyLike =
  | string
  | number
  | (string | number)[]
  | Record<string, string | number>;

type KeyAttribOrder<KeyType> = KeyType extends Record<string, unknown>
  ? (keyof KeyType)[]
  : never;

interface CacheServiceOptions<KeyType extends CacheKeyLike> {
  /** Service name */
  name: string;
  /** Invalidate cache data after set time. Defaults to 5 minutes. */
  expiresInSec?: number;
  /** Add a fixed prefix to the key */
  keyPrefix?: string;
  /** Separator to use when assembling they key */
  keySeparator?: string;
  /**
   * For complex keys (objects), specify the order of the attributes
   * to use when assembling the final key
   */
  keyAttribOrder?: KeyAttribOrder<KeyType>;
  /**
   * For complex keys (objects) only.
   * Default value to use if the attribute specified in `keyAttribOrder` is `undefined`
   */
  keyAttribDefault?: KeyType extends Record<string, unknown> ? string : never;
  /**
   * Suppresses warnings that are generated when a key contains
   * attributes not specified in `.attribOrder`.
   * Has no effect if `.attribOrder` is not set.
   */
  suppressTypeWarnings?: boolean;
}

type GetDataOptions = {
  forceRefresh?: boolean;
  expiresInSec?: number;
};

type SetCacheOptions = {
  expiresInSec?: number;
};

type GetDBReturnType<DataType> = {
  data: DataType;
  expiresInSec?: number;
};

export default abstract class CacheService<
  KeyType extends CacheKeyLike = string,
  DataType = unknown
> extends Service {
  static UNDEFINED = '__UNDEFINED';
  static NULL = '__NULL';

  public expiresInSec: number;
  private keyPrefix: string;
  private keySeparator: string;
  private keyAttribOrder?: KeyAttribOrder<KeyType>;
  private keyAttribDefault?: string;
  private suppressTypeWarnings: boolean;

  constructor(options: CacheServiceOptions<KeyType>) {
    const {
      expiresInSec,
      keyPrefix,
      keySeparator,
      keyAttribOrder,
      keyAttribDefault,
      suppressTypeWarnings,
      name,
    } = options;
    super({ name });

    this.expiresInSec = expiresInSec || 1000 * 60 * 5; // 5 minute
    this.keyPrefix = keyPrefix || '';
    this.keySeparator = keySeparator || ':';
    this.keyAttribOrder = keyAttribOrder;
    this.keyAttribDefault = keyAttribDefault;
    this.suppressTypeWarnings = suppressTypeWarnings || false;
    this.__status = 'AVAILABLE';
  }

  /**
   * Look for data in the cache first(fast), and query the DB(slow) if not found or if cache is unavailable.
   * @param key Simple(string) or complex(array or object) keys. Cannot be falsy or empty.
   * @returns Fetched data
   */
  public async getData(
    key: KeyType,
    options: GetDataOptions = {}
  ): Promise<DataType | undefined> {
    const { forceRefresh, expiresInSec } = options;
    let isInCache = false;
    let data: DataType | undefined = undefined;

    // Fetch data from cache (fast)
    if (!forceRefresh) {
      const assembledKey = this.assembleKey(key);
      try {
        const cached = await this.getCache(assembledKey);
        if (cached !== null) {
          isInCache = true;
          data = cached === CacheService.UNDEFINED ? undefined : cached;
        }
      } catch (error) {
        // Silently fail
        logger.log({
          service: this,
          error,
          message: 'Failed to read from cache',
        });
      }
    }

    // Fetch data from database (slow)
    if (!isInCache) {
      const res = await this.getDB(key);
      data = res.data;
      this.setCache(this.assembleKey(key), data, {
        expiresInSec: options?.expiresInSec || res.expiresInSec,
      }).catch((error) => {
        logger.log({
          service: this,
          error,
          message: 'Failed to write to cache',
        });
      }); // do not wait, but need to catch the error and log it
    }

    return data;
  }

  /**
   * Look for data in the cache (fast)
   * @param key Key to use to search for value
   * @returns Cached data corresponding to given key.
   */
  protected abstract getCache(key: string): Promise<DataType | null>;

  /**
   * Update the cache with recent information
   * @param key Cache key
   * @param data Data to store in cache
   * @param options Options to override default settings
   */
  protected abstract setCache(
    key: string,
    data: DataType | undefined,
    options?: SetCacheOptions
  ): Promise<void>;

  /**
   * Look for data in the database (slow)
   * @param key Key to use to search for value
   * @returns Data corresponding to given key
   */
  protected abstract getDB(key: KeyType): Promise<GetDBReturnType<DataType>>;

  /**
   * Assemble complex keys to a string form
   * @param key Simple(string) or complex(array or object) key
   * @returns Assembled (string) key
   */
  private assembleKey(key: KeyType): string {
    // key is required
    if (!key) throw new CacheError({ code: 'CACHE/NF_KEY' });

    let assembledKey = '';
    if (typeof key === 'string') {
      // SIMPLE KEY (string)
      // Strings do not need assembly. Use as is.
      assembledKey = key;
    } else if (typeof key === 'number') {
      assembledKey = key.toString();
    } else if (typeof key === 'object') {
      // COMPLEX KEY
      let values: string[];
      if (key instanceof Array) {
        // COMPLEX KEY (array)
        values = key.map((value) => String(value));
      } else {
        // COMPLEX KEY (object)
        values = [];
        const attribs = this.keyAttribOrder || Object.keys(key).sort();
        const attribSet = this.keyAttribOrder ? new Set(attribs) : undefined;

        attribs.forEach((attrib) => {
          values.push(
            key[attrib] === undefined && this.keyAttribDefault !== undefined
              ? this.keyAttribDefault
              : String(key[attrib])
          );
          attribSet?.delete(attrib);
        });

        // If attribOrder does not specify some of the attributes in an object,
        // issue a warning
        if (attribSet?.size && !this.suppressTypeWarnings) {
          throw new CacheError({
            code: 'CACHE/WR_KEY_TYPE',
            message: Array.from(attribSet).join(', '),
          });
        }
      }
      assembledKey = values.join(this.keySeparator);
      if (!assembledKey) {
        throw new CacheError({
          code: 'CACHE/NF_KEY',
          message: `Keys cannot be empty ${
            key instanceof Array ? 'arrays' : 'objects'
          }. ${JSON.stringify(key)}`,
        });
      }
    } else {
      throw new CacheError({
        code: 'CACHE/IV_KEY',
        message: `Key cannot be of type "${typeof key}"`,
      });
    }

    return `${this.keyPrefix}${this.keySeparator}${assembledKey}`;
  }
}
