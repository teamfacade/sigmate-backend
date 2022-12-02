import { Transaction, ModelStatic, Model, Identifier } from 'sequelize/types';
import { ActionStatus } from '../utils/status';
import Database from './Database';
import ActionError from './errors/ActionError';
import RequestError from './errors/RequestError';

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

type ErrorTypes =
  | 'TX START FAILED'
  | 'ALREADY ENDED'
  | 'PARENT ALREADY ENDED'
  | 'CHILD FAILED'
  | 'TX COMMIT FAILED'
  | 'TX ROLLBACK FAILED';

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
  database: Database;
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
   *
   * If this action finishes successfully --> `COMMIT`
   *
   * If this action fails due to an error --> `ROLLBACK`
   *
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
  /**
   * Data to write to the logs for debugging
   */
  data?: Record<string, unknown>;

  constructor(options: ActionOptions<TPKT, SPKT>) {
    const { type, name, transaction, isLastChild, target, source } = options;
    this.type = type || Action.TYPE.SERVICE;
    this.name = name;
    this.status = Action.STATE.INITIALIZED;
    this.database = new Database();
    // TODO this.auth = new Auth();
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
        this.transaction = await Database.transaction();
      } catch (error) {
        this.onError({ type: 'TX START FAILED', error });
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

  public setTarget(target: ActionObject<TPKT>) {
    this.target = { ...this.target, ...target };
  }

  public setSource(source: ActionObject<SPKT>) {
    this.source = { ...this.source, ...source };
  }

  public async run<T>(
    worker: (
      action: typeof this,
      transaction: typeof this.transaction
    ) => Promise<T>
  ) {
    if (this.ended || this.parent?.ended) return;
    if (!this.started) await this.start();
    let res: Awaited<ReturnType<typeof worker>>;
    try {
      if (this.type === Action.TYPE.DATABASE) {
        res = await this.database.run(() => worker(this, this.transaction));
      } else {
        res = await worker(this, this.transaction);
      }
      await this.onFinish();
      return res;
    } catch (error) {
      await this.onError({ error });
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
        await this.onError({ type: 'TX COMMIT FAILED', error });
      }
    }
    this.status = Action.STATE.FINISHED;
    this.onEnd();
    if (this.parent && this.isLastChild) {
      await this.parent.onFinish();
    }
  }

  private async onError(options: sigmate.Error.HandlerOptions<ErrorTypes>) {
    this.status = Action.STATE.FAILED;

    const { type, error: cause } = options;
    let error: RequestError = cause as RequestError;

    if (!(cause instanceof RequestError)) {
      let message = options.message;
      let critical = false;
      let level: sigmate.Logger.Level | undefined = undefined;

      if (!message) {
        switch (type) {
          case 'ALREADY ENDED':
            message = 'Action already ended.';
            break;
          case 'PARENT ALREADY ENDED':
            if (this.parent) {
              message = `Parent action '${this.parent?.name}' already ended`;
            } else {
              message = `Received 'PARENT ALREADY ENDED', but parent action not found.`;
              level = 'warn';
            }
            break;
          case 'CHILD FAILED':
            message = "Received 'CHILD FAILED' but child action not found.";
            level = 'warn';
            break;
          case 'TX START FAILED':
            message = 'Transaction start failed';
            break;
          case 'TX COMMIT FAILED':
            message = 'Transaction commit failed';
            level = 'warn';
            break;
          case 'TX ROLLBACK FAILED':
            message = 'Transaction rollback failed';
            critical = true;
            break;
          default:
            message = 'Unexpected ActionError';
            critical = true;
            break;
        }
      }

      error = new ActionError({
        action: this,
        message,
        critical,
        level,
        cause,
        status: 500,
      });
    }

    this.onEnd();

    if (this.parent) {
      // Children: Ask parent to solve their problems for them
      await this.parent.onError({ type: 'CHILD FAILED', error });
    } else {
      // Parents
      if (this.transaction && type !== 'TX ROLLBACK FAILED') {
        try {
          await this.transaction.rollback();
        } catch (txError) {
          this.onError({ type: 'TX ROLLBACK FAILED', error: txError });
        }
      }

      // Throw the error (to be logged elsewhere)
      throw error;
    }
  }
}
