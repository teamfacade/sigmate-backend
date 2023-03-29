import WikiVCSError from '../../errors/wiki/vcs';
import { ActionArgs } from '../../utils/action';
import WikiExt from './ext';

type BaseAttribs<IdType, VersionIdType> = {
  id: IdType;
  version: VersionIdType;
};

export type BuildArgs<VersionIdType extends string = string> = {
  version?:
    | VersionIdType
    | typeof WikiVCS['VERSION_LATEST']
    | typeof WikiVCS['VERSION_SELECTED']
    | undefined;
  options: {
    extData?: WikiExt;
    force?: boolean;
    blockStructure?: sigmate.Wiki.BlockStructure;
    select?: boolean;
  };
};

export type CreateArgs<
  BuildAttribs extends BaseAttribs<IdType, VersionIdType> & object,
  IdType extends string,
  VersionIdType extends string
> = {
  build: Omit<BuildAttribs, 'id' | 'version'>;
};

export type UpdateArgs<
  BuildAttribs extends BaseAttribs<IdType, VersionIdType> & object,
  IdType extends string,
  VersionIdType extends string
> = {
  build: Omit<BuildAttribs, 'version'>;
};

export type LoadItemArgs<VersionIdType extends string> = {
  version:
    | VersionIdType
    | typeof WikiVCS['VERSION_LATEST']
    | typeof WikiVCS['VERSION_SELECTED']
    | undefined;
  force?: boolean;
  select?: boolean;
};

type SetItemEventHandler<
  ItemAttribs extends BaseAttribs<IdType, VersionIdType> & object,
  IdType extends string = string,
  VersionIdType extends string = string
> = (
  item: ItemAttribs,
  options: { select?: boolean; isLatest?: boolean }
) => void;

type VCSOptions<
  ItemAttribs extends BaseAttribs<IdType, VersionIdType> & object,
  IdType extends string = string,
  VersionIdType extends string = string
> = {
  onSetItem?: SetItemEventHandler<ItemAttribs, IdType, VersionIdType>;
};

export abstract class WikiVCS<
  RawItemAttribs extends object,
  ItemAttribs extends BaseAttribs<IdType, VersionIdType> & object,
  BuildAttribs extends BaseAttribs<IdType, VersionIdType> & object,
  IdType extends string = string,
  VersionIdType extends string = string
> {
  static VERSION_LATEST: 'latest' = 'latest';
  static VERSION_SELECTED: 'selected' = 'selected';

  public id: IdType;
  protected selectedVersion?: VersionIdType;
  protected latestVersion?: VersionIdType;
  protected itemMap: Map<
    VersionIdType | typeof WikiVCS['VERSION_LATEST'],
    ItemAttribs
  >;
  protected buildMap: Map<VersionIdType, BuildAttribs>;
  private onSetItem?: SetItemEventHandler<ItemAttribs, IdType, VersionIdType>;

  constructor(
    id: IdType,
    options: VCSOptions<ItemAttribs, IdType, VersionIdType> = {}
  ) {
    this.id = id;
    this.itemMap = new Map();
    this.buildMap = new Map();
    this.onSetItem = options.onSetItem;
  }

  public abstract build(
    args: BuildArgs<VersionIdType> & ActionArgs
  ): Promise<BuildAttribs>;

  // public abstract create(
  //   args: CreateArgs<BuildAttribs, IdType, VersionIdType> & ActionArgs
  // ): Promise<BuildAttribs>;
  // public abstract update(
  //   args: UpdateArgs<BuildAttribs, IdType, VersionIdType> & ActionArgs
  // ): Promise<BuildAttribs>;
  // protected abstract delete(): Promise<unknown>;

  protected abstract loadItem(
    args: LoadItemArgs<VersionIdType> & ActionArgs
  ): Promise<ItemAttribs>;

  protected abstract toItem(rawItem: RawItemAttribs): ItemAttribs;
  protected abstract toRawItem(item: ItemAttribs): RawItemAttribs;

  public getVersionId(
    version:
      | VersionIdType
      | typeof WikiVCS['VERSION_LATEST']
      | typeof WikiVCS['VERSION_SELECTED']
      | undefined,
    options: { latestToId?: boolean } = {}
  ): VersionIdType | typeof WikiVCS.VERSION_LATEST {
    const { latestToId } = options;
    if (version === undefined) version = WikiVCS.VERSION_SELECTED;
    if (version === WikiVCS.VERSION_LATEST && latestToId) {
      if (this.latestVersion) {
        return this.latestVersion;
      } else {
        throw new WikiVCSError('WIKI/VCS/ER_LATEST_NOT_LOADED');
      }
    } else if (version === WikiVCS.VERSION_SELECTED) {
      if (this.selectedVersion) {
        return this.selectedVersion;
      } else {
        throw new WikiVCSError('WIKI/VCS/ER_NOT_SELECTED');
      }
    } else {
      if (version) {
        return version;
      } else {
        throw new WikiVCSError('WIKI/VCS/ER_VERSION');
      }
    }
  }

  public getBuild(
    version:
      | VersionIdType
      | typeof WikiVCS['VERSION_LATEST']
      | typeof WikiVCS['VERSION_SELECTED']
      | undefined = WikiVCS.VERSION_SELECTED
  ) {
    if (version === WikiVCS.VERSION_LATEST) {
      version = this.latestVersion;
    } else if (version === WikiVCS.VERSION_SELECTED) {
      version = this.selectedVersion;
    } else if (!version) {
      version = this.selectedVersion;
    }
    if (!version) return undefined;
    return this.buildMap.get(version);
  }

  public setBuild(
    build: BuildAttribs,
    options: { select?: boolean; isLatest?: boolean } = {}
  ) {
    const { select, isLatest } = options;
    if (build.id !== this.id) {
      throw new WikiVCSError({
        code: 'WIKI/VCS/ER_ID',
        message: `Expected: ${this.id}, Got: ${build.id}`,
      });
    }
    this.buildMap.set(build.version, build);
    if (select) this.selectedVersion = build.version;
    if (isLatest) this.latestVersion = build.version;
  }

  public getItem(
    version:
      | VersionIdType
      | typeof WikiVCS['VERSION_LATEST']
      | typeof WikiVCS['VERSION_SELECTED']
      | undefined = WikiVCS.VERSION_SELECTED
  ) {
    version = this.getVersionId(version);
    return this.itemMap.get(version);
  }

  public setItem(
    item: ItemAttribs,
    options: { select?: boolean; isLatest?: boolean } = {}
  ) {
    const { select = true, isLatest = false } = options;
    if (item.id !== this.id) {
      throw new WikiVCSError({
        code: 'WIKI/VCS/ER_ID',
        message: `Expected: ${this.id}, Got: ${item.id}`,
      });
    }
    this.itemMap.set(item.version, item);
    if (select) this.selectedVersion = item.version;
    if (isLatest) this.latestVersion = item.version;
    if (this.onSetItem) this.onSetItem(item, options);
  }

  public setRawItem(
    rawItem: RawItemAttribs,
    options: { select?: boolean; isLatest?: boolean } = {}
  ) {
    this.setItem(this.toItem(rawItem), options);
  }

  protected setEventHandler(
    event: 'setItem',
    handler: SetItemEventHandler<ItemAttribs, IdType, VersionIdType>
  ) {
    switch (event) {
      case 'setItem':
        this.onSetItem = handler;
        break;
    }
  }
}
