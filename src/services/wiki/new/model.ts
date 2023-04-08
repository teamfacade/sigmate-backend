import Droplet from '../../../utils/droplet';
import { ActionArgs } from '../../../utils/action';

type ModelBase = {
  id: string;
  version: string;
  isLatest: boolean;
};

export default abstract class WikiModel<
  DynamoAttribs extends object,
  ModelAttribs extends ModelBase & object,
  ModelCAttribs extends object,
  ModelUAttribs extends object,
  ModelResponse extends object
  // SqlModel extends Model
> {
  public static VERSION_LATEST: 'latest' = 'latest';
  public static CACHE_LATEST: 'latest' = 'latest';
  public static CACHE_BUILD: 'build' = 'build';
  protected static BATCH_DELAY = 250;
  protected static BATCH_DELAY_MAX = 16000;

  // public id: string;
  private __id?: string;
  public get id() {
    if (!this.__id) this.__id = Droplet.generate();
    return this.__id;
  }

  protected __model?: ModelAttribs;
  protected get model() {
    if (!this.__model) {
      throw new Error('item not loaded');
    }
    return this.__model;
  }
  protected set model(value: ModelAttribs) {
    this.__model = value;
  }

  public get version() {
    return this.model.version;
  }

  public get isLatest() {
    return this.model.isLatest;
  }

  constructor(id?: string) {
    this.__id = id;
  }

  public abstract build(): ModelResponse;

  public abstract load(
    args: { version?: string; consistent?: boolean } & ActionArgs
  ): Promise<ModelAttribs>;

  public abstract create(
    args: { request: ModelCAttribs } & ActionArgs
  ): Promise<
    WikiModel<
      DynamoAttribs,
      ModelAttribs,
      ModelCAttribs,
      ModelUAttribs,
      ModelResponse
    >
  >;

  public abstract update(
    args: { request: ModelUAttribs } & ActionArgs
  ): Promise<[boolean, ModelAttribs]>;

  public abstract delete(args: ActionArgs): Promise<void>;

  protected abstract __load(dynamo: DynamoAttribs): ModelAttribs;

  protected abstract __save(
    cache?: typeof WikiModel['CACHE_LATEST'] | typeof WikiModel['CACHE_BUILD']
  ): DynamoAttribs;
}
