import { Transaction, ModelStatic, Model, Identifier } from 'sequelize/types';
import { ActionStatus } from '../utils/status';

export const ActionTypes = Object.freeze({
  SERVICE: 0,
  DATABASE: 1,
  HTTP: 2,
});

type ActionObject<
  PrimaryKeyType extends Identifier = number,
  // eslint-disable-next-line @typescript-eslint/ban-types
  MAttribs extends {} = any,
  // eslint-disable-next-line @typescript-eslint/ban-types
  MCAttribs extends {} = any,
  M extends Model<MAttribs, MCAttribs> = Model<MAttribs, MCAttribs>
> = {
  model: ModelStatic<M>;
  id?: PrimaryKeyType;
};

type ActionOptions<TPKT extends Identifier, SPKT extends Identifier> = {
  type?: typeof ActionTypes[keyof typeof ActionTypes];
  /** Name of the action (for logging) */
  name: string;
  /** Auth instance to authorize the action with */
  // TODO AuthService
  /**
   * If set to `true`, a managed transaction will be started.
   * If provided with a started Transaction instance, the transaction will be used.
   * If set to `false`, or not defined, the action will not use any transactions for its query.
   */
  transaction?: boolean | Transaction;
  /**
   * (Child action) When set to true, the parent action will automatically finish
   * when this action finishes successfully.
   * It has no effect on root actions (actions without a parent)
   */
  isLastChild?: boolean;
  target?: ActionObject<TPKT>;
  source?: ActionObject<SPKT>;
};

export default class Action<
  TPKT extends Identifier = number,
  SPKT extends Identifier = number,
  PTPKT extends Identifier = TPKT,
  PSPKT extends Identifier = SPKT
> {
  /**
   * List of available action types.
   *
   * **SERVICE**: (default) An action that does not require external services
   * or is a compound action.
   *
   * **DATABASE**: Action that contains Sigmate database query calls
   *
   * **HTTP**: Action that includes making HTTP request(s) to external service(s)
   */
  static TYPE = ActionTypes;
  static STATE = ActionStatus;

  type: typeof ActionTypes[keyof typeof ActionTypes];
  name: string;
  status: typeof ActionStatus[keyof typeof ActionStatus];
  // TODO auth: AuthService;
  get started() {
    return this.status >= Action.STATE.STARTED;
  }
  get ended() {
    return this.status >= Action.STATE.FINISHED;
  }
  private __duration: number | undefined = undefined;
  /** The time it took for the action to complete  */
  get duration() {
    if (this.ended) {
      return this.__duration;
    }
    return undefined;
  }
  /** Transaction that will be used for database calls (if any) */
  transaction?: Transaction = undefined;
  /**
   * Transaction will be managed by this Action instance.
   * When this action starts, a transaction will be started.
   * If this action finishes successfully --> `COMMIT`
   * If this action fails due to an error --> `ROLLBACK`
   * If this action is restarted, the previous transaction
   * will be rolled back and a new transaction will be started.
   */
  isManagedTx?: boolean = undefined;
  /**
   * A promise that resolves when a managed transaction has
   * started successfully.
   */
  startTxPromise?: Promise<Transaction>;
  /**
   * An error thrown during action execution, that caused the action to fail.
   */
  error: unknown = undefined;

  target?: ActionObject<TPKT>;
  source?: ActionObject<SPKT>;

  // Compound actions (actions consisting of multiple sub-actions)
  /**
   * The parent action that spawned this action
   */
  parent?: Action<PTPKT, PSPKT>;
  /**
   * Children action spawned by this action
   */
  children: Action<any, any>[] = [];
  /**
   * When set as `true`, and this action is not the root action,
   * the parent action of this action will finish when this action finishes
   */
  isLastChild?: boolean;

  constructor(options: ActionOptions<TPKT, SPKT>) {
    const { type, name, transaction, isLastChild, target, source } = options;
    this.type = type || Action.TYPE.SERVICE;
    this.name = name;
    this.status = Action.STATE.INITIALIZED;
    // TODO this.auth = auth;
    this.isLastChild = isLastChild;
    this.target = target;
    this.source = source;
    if (this.transaction) {
      if (typeof transaction === 'boolean') {
        this.isManagedTx = true;
      } else {
        this.isManagedTx = false;
        this.transaction = transaction;
      }
    }
  }

  public reset() {
    this.status = Action.STATE.INITIALIZED;
    this.__duration = undefined;
    this.error = undefined;
    if (this.isManagedTx) {
      this.transaction = undefined;
    }
  }

  public async start() {
    if (this.parent && !this.parent.started) await this.parent.start();
    this.__duration = performance.now();
    if (this.isManagedTx && !this.transaction) {
      try {
        // TODO this.transaction = await this.db.sequelize.transaction();
      } catch (error) {
        this.onError(error);
      }
    }
    this.status = Action.STATE.STARTED;
  }

  public createChild<CTPKT extends Identifier, CSPKT extends Identifier>(
    options: Omit<ActionOptions<CTPKT, CSPKT>, 'auth' | 'transaction'>
  ) {
    const child = new Action<CTPKT, CSPKT, TPKT, SPKT>({
      ...options,
      // TODO auth: this.auth,
      transaction: this.transaction,
    });
    this.children.push(child);
    child.parent = this;
    return child;
  }

  public async run<T>(
    worker: (
      action: Action<TPKT, SPKT>,
      transaction: Transaction | undefined
    ) => Promise<T>
  ) {
    if (this.ended || this.parent?.ended) {
      throw new Error('ACTION_ALREDY_ENDED');
    }
    if (!this.started) await this.start();
    let res: Awaited<T>;
    try {
      if (this.type === Action.TYPE.DATABASE) {
        // TODO res = await this.db.run(() => worker(this, this.transaction));
      } else {
        res = await worker(this, this.transaction);
      }

      await this.onFinish();
      return res;
    } catch (error) {
      await this.onError(error);
      throw new Error('ACTION_ERROR');
    }
  }

  private onEnd() {
    this.__duration = performance.now() - (this.__duration as number);
  }

  private async onFinish() {
    if (!this.parent) {
      try {
        await this.transaction?.commit();
      } catch (error) {
        await this.onError(error);
      }
    }
    this.status = Action.STATE.FINISHED;
    this.onEnd();
    if (this.parent && this.isLastChild) {
      await this.parent.onFinish();
    }
  }

  private async onError(error: unknown = undefined) {
    if (error !== undefined) this.error = error;
    if (!this.parent) {
      try {
        await this.transaction?.rollback();
      } catch (error) {
        throw new Error('ACTION_TX_ROLLBACK_ERROR');
      }
    } else {
      await this.parent?.onError(error);
    }
    this.status = Action.STATE.FAILED;
    this.onEnd();
  }
}
