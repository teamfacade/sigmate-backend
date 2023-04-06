import BlockVersion from '../../dynamoose/models/wiki/BlockVersion';
import WikiVCSError from '../../errors/wiki/vcs';
import { waitFor } from '../../utils';
import { ActionArgs, ActionMethod } from '../../utils/action';
import Droplet from '../../utils/droplet';

type BaseAttribs = {
  id: string;
  version: string;
  isLatest: boolean;
};

export type CommandInput<RawItemAttribs extends sigmate.Wiki.WikiAttribs> = {
  /** Item to put (create or overwrite) */
  put?: RawItemAttribs[];
  /** Key to use to find the item to delete */
  _delete?: sigmate.Wiki.WikiAttribs[];
  /** Key to use to find the item, and (partial) data to update */
  update?: {
    key:
      | Pick<sigmate.Wiki.WikiAttribs, 'WikiPK' | 'WikiSK'>
      | Required<Pick<sigmate.Wiki.WikiAttribs, 'WikiGSIPK' | 'WikiGSISK'>>;
    attribs: Partial<RawItemAttribs>;
  };
};

export abstract class WikiVCS<
  RawItemAttribs extends sigmate.Wiki.WikiAttribs,
  ItemAttribs extends BaseAttribs & object,
  ResponseAttribs extends object,
  RequestCAttribs extends object,
  RequestUAttribs extends object = RequestCAttribs
> {
  static VERSION_LATEST: 'latest' = 'latest';

  static CACHE_LATEST: 'latest' = 'latest';
  static CACHE_BUILD: 'build' = 'build';

  static BATCH_DELAY_INIT = 500;
  static BATCH_DELAY_MAX = 16000;

  public id: string;
  protected __latest?: ItemAttribs;
  public get latest() {
    if (!this.__latest) {
      throw new WikiVCSError('WIKI/VCS/ER_LATEST_NOT_LOADED');
    }
    return this.__latest;
  }
  protected set latest(item: ItemAttribs) {
    if (this.__latest) {
      this.__latest.isLatest = item.version === this.__latest.version;
    }
    if (!item.isLatest) {
      throw new Error('Old versions cannot be set as latest');
    }
    this.__latest = item;
  }

  protected __selected?: ItemAttribs;
  public get selected() {
    if (!this.__selected) {
      throw new WikiVCSError('WIKI/VCS/ER_NOT_SELECTED');
    }
    return this.__selected;
  }
  protected set selected(item: ItemAttribs) {
    this.__selected = item;
  }

  protected versionMap: Map<string, ItemAttribs>;

  constructor(id?: string | undefined) {
    this.id = id || Droplet.generate();
    this.versionMap = new Map();
  }

  @ActionMethod({
    name: 'WIKI/VCS/SAVE',
    type: 'AWS',
  })
  public async save(
    args: { input: CommandInput<RawItemAttribs> } & ActionArgs
  ): Promise<void> {
    const { input } = args;
    const { put, _delete, update } = input;
    if (put && put.length > 0) {
      const result = await BlockVersion.batchPut(put);
      let delay = WikiVCS.BATCH_DELAY_INIT;
      let unprocessedItems = result.unprocessedItems;
      while (unprocessedItems.length > 0) {
        await waitFor(delay);
        const result = await BlockVersion.batchPut(unprocessedItems);
        unprocessedItems = result.unprocessedItems;
        if (delay <= WikiVCS.BATCH_DELAY_MAX / 2) delay *= 2;
      }
    }
    if (_delete && _delete.length > 0) {
      const result = await BlockVersion.batchDelete(
        _delete as unknown as Record<string, string>[]
      );
      let delay = WikiVCS.BATCH_DELAY_INIT;
      let unprocessedItems = result.unprocessedItems;
      while (unprocessedItems.length > 0) {
        await waitFor(delay);
        const result = await BlockVersion.batchDelete(unprocessedItems);
        unprocessedItems = result.unprocessedItems;
        if (delay <= WikiVCS.BATCH_DELAY_MAX / 2) delay *= 2;
      }
    }
    if (update) {
      const { key, attribs } = update;
      await BlockVersion.update(key, attribs);
    }
  }

  protected getVersion(
    version: string | typeof WikiVCS['VERSION_LATEST'] | undefined,
    options: { exists: true }
  ): ItemAttribs;
  protected getVersion(
    version: string | typeof WikiVCS['VERSION_LATEST'] | undefined,
    options?: { exists?: false }
  ): ItemAttribs | undefined;
  protected getVersion(
    version: string | typeof WikiVCS['VERSION_LATEST'] | undefined,
    options?: { exists?: boolean }
  ): ItemAttribs | undefined {
    if (version === WikiVCS.VERSION_LATEST) {
      const item = this.__latest;
      if (options?.exists && !item) {
        throw new WikiVCSError('WIKI/VCS/ER_LATEST_NOT_LOADED');
      }
      return item;
    } else {
      const item = version ? this.versionMap.get(version) : this.__selected;
      if (options?.exists && !item) {
        throw new WikiVCSError({
          code: 'WIKI/VCS/NF_VERSION',
          message: `version: ${version || 'selected'}`,
        });
      }
      return item;
    }
  }

  protected setVersion(item: ItemAttribs, options?: { select?: boolean }) {
    const select = options?.select === undefined ? true : options.select;
    this.versionMap.set(item.version, item);
    if (item.isLatest) {
      if (this.__latest) {
        this.latest.isLatest = false;
      }
      this.latest = item;
    }
    if (select) this.selected = item;
  }

  /**
   * Load a certain version from the DB
   * @param args.version Version to load. Use latest or selected
   * @param args.select After loading, select the version. Defaults to `true`
   * @param args.force If set to `false`, return immediately if version has already been loaded before.
   */
  public abstract load(
    args: {
      version: string | typeof WikiVCS['VERSION_LATEST'];
      select?: boolean;
      force?: boolean;
    } & ActionArgs
  ): Promise<ItemAttribs>;

  /**
   * Create a response to send to the client
   * @param args
   */
  public abstract build(
    args: {
      version?: string | typeof WikiVCS['VERSION_LATEST'];
      select?: boolean;
      force?: boolean;
      transposed?: sigmate.Wiki.DiffTranspose; // Block only
      loadAuditor?: boolean;
    } & ActionArgs
  ): Promise<ResponseAttribs>;

  public abstract create(
    args: { execute?: boolean; request: RequestCAttribs } & ActionArgs
  ): Promise<CommandInput<RawItemAttribs>>;

  public abstract update(
    args: { execute?: boolean; request: RequestUAttribs } & ActionArgs
  ): Promise<CommandInput<RawItemAttribs>>;

  public abstract delete(
    args: { execute?: boolean } & ActionArgs
  ): Promise<CommandInput<RawItemAttribs>>;

  /**
   * Create a DTO from client create request.
   * Request must be validated elsewhere
   */
  protected abstract __create(
    request: RequestCAttribs,
    rest: Partial<ItemAttribs>
  ): ItemAttribs;

  /**
   * Create a DTO for updates from a client update request.
   * Calculate diffs using the latest version.
   * @param request Client update request
   * @throws WikiVCSError if latest version is not loaded
   */
  protected abstract __update(
    request: RequestUAttribs,
    rest: Partial<ItemAttribs>
  ): ItemAttribs;

  /**
   * Create a partial DTO needed for a deletion operation.
   * Must be called after a strongly consistent load of the latest item
   *
   * A delete operation is executed by 2 UpdateItem API calls on the latest version item
   * * Update Diff values on the cache, delete external data cache
   * * Copy verification data from the cache to the original item
   */
  protected abstract __delete(
    latest: ItemAttribs,
    rest: Partial<ItemAttribs>
  ): Partial<ItemAttribs>;

  /**
   * Create a DTO from DynamoDB data (data conversion only)
   * @param raw DynamoDB data
   * @returns Object DTO
   */
  protected abstract __load(raw: RawItemAttribs): ItemAttribs;

  /**
   * Generate data to store on DynamoDB
   * @param item DTO
   * @returns Raw data to directly store on DynamoDB
   */
  protected abstract __save(
    item: ItemAttribs,
    option?: typeof WikiVCS['CACHE_LATEST'] | typeof WikiVCS['CACHE_BUILD']
  ): RawItemAttribs;

  // /**
  //  * Generate a response to send to the client
  //  * @param item
  //  */
  // protected abstract __build(item: ItemAttribs): ResponseAttribs;
}
