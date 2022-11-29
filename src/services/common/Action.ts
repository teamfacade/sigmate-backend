import { Transaction, ModelStatic } from 'sequelize/types';
import { v4 as uuidv4 } from 'uuid';
import services from '..';
import AuthService from './auth/AuthService';

type ActionStatus = 0 | 1 | 2 | 3;
type ActionType = 0 | 1 | 2;

type ActionObject<PrimaryKeyType = number> = {
  model: ModelStatic<any>;
  pk?: PrimaryKeyType;
};

type ActionOptions<TT = number, ST = number> = {
  /** Name of the action (for logging) */
  name: string;
  /** Auth instance to authorize the action with */
  auth: AuthService;

  type?: ActionType;
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
  lastChild?: boolean;
  target?: ActionObject<TT>;
  source?: ActionObject<ST>;
};

export default class Action {
  /**
   * (Default) A compound action or an action that does not require
   * external services
   */
  static SERVICE: 0 = 0;
  /**
   * Action that contains Sigmate database query calls
   */
  static DATABASE: 1 = 1;
  /**
   * Action that includes making HTTP request(s) to external service(s)
   */
  static HTTP: 2 = 2;

  /** Action was initialized but not started yet */
  static NOT_STARTED: 0 = 0;
  /** Action has been started and still in progress. */
  static STARTED: 1 = 1;
  /** Action has completed successfully without any errors. */
  static FINISHED: 2 = 2;
  /** Action has failed due to an error */
  static ERROR: 3 = 3;

  /** Action ID */
  id: string;
  /** Action name */
  name: string;
  /**
   * Action type. Use either `Action.SERVICE` or `Action.DATABASE`.
   * For service-level (logical) action, use `SERVICE`.
   * When set as `Action.DATABASE`, the action worker will be run with `DatabaseService`, with proper logging.
   */
  type: ActionType;
  status: ActionStatus = Action.NOT_STARTED;
  get started() {
    return this.status >= Action.STARTED;
  }
  get ended() {
    return this.status >= Action.FINISHED;
  }
  private __duration: number | undefined = undefined;
  /** The time it took for the action to complete  */
  get duration() {
    if (this.status === Action.FINISHED) {
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

  /** Shortcut to global DatabaseService instance */
  get db() {
    return services.db;
  }

  /** The Auth instance used to authorize this action */
  auth: AuthService;
  /** Shortcut to the User Model instance in Auth */
  get userModel() {
    return this.auth.user.model;
  }
  /** Shortcut to the Device Model instance in Auth */
  get deviceModel() {
    return this.auth.device.model;
  }

  target?: ActionObject;
  source?: ActionObject;

  // Compound actions (actions consisting of multiple sub-actions)
  /**
   * The parent action that spawned this action
   */
  parent?: Action;
  /**
   * Children action spawned by this action
   */
  children: Action[] = [];
  /**
   * When set as `true`, and this action is not the root action,
   * the parent action of this action will finish when this action finishes
   */
  isLastChild?: boolean;
  get isRoot() {
    return this.parent === undefined;
  }

  constructor(options: ActionOptions) {
    this.id = uuidv4();

    const {
      name,
      auth,
      target,
      source,
      type,
      lastChild: last,
      transaction,
    } = options;
    this.name = name;
    this.auth = auth;
    this.target = target;
    this.source = source;
    this.type = type || Action.SERVICE;
    this.isLastChild = last === undefined ? undefined : last;

    if (transaction) {
      if (typeof transaction === 'boolean') {
        this.isManagedTx = true;
      } else {
        this.isManagedTx = false;
        this.transaction = transaction;
      }
    }
  }

  public reset() {
    this.status = Action.NOT_STARTED;
    this.__duration = undefined;
    this.error = undefined;
    if (this.isManagedTx) {
      this.transaction = undefined;
    }
  }

  private async start() {
    if (this.parent && !this.parent.started) await this.parent.start();
    this.__duration = performance.now();
    if (this.isManagedTx && !this.transaction) {
      try {
        this.transaction = await this.db.sequelize.transaction();
      } catch (error) {
        this.onError(error);
      }
    }
    this.status = Action.STARTED;
  }

  public createChild(options: Omit<ActionOptions, 'auth' | 'transaction'>) {
    const action = new Action({
      ...options,
      auth: this.auth,
      transaction: this.transaction,
    });
    this.children.push(action);
    action.parent = this;
    return action;
  }

  public async run<T>(
    worker: (action: Action, transaction: Transaction | undefined) => Promise<T>
  ) {
    if (this.ended || this.parent?.ended) {
      throw new Error('ACTION_ALREDY_ENDED');
    }
    if (!this.started) await this.start();
    let res: Awaited<T>;
    try {
      if (this.type === Action.SERVICE) {
        res = await worker(this, this.transaction);
      } else if (this.type === Action.DATABASE) {
        res = await this.db.run(() => worker(this, this.transaction));
      } else {
        throw new Error('UNEXPECTED_ACTION_TYPE');
      }

      await this.onFinish();
      return res;
    } catch (error) {
      await this.onError(error);
      throw new Error('ACTION_ERROR');
    }
  }

  private async onFinish() {
    if (this.isRoot) {
      try {
        await this.transaction?.commit();
      } catch (error) {
        throw new Error('ACTION_TX_COMMIT_ERROR');
      }
    }
    this.status = Action.FINISHED;
    this.__duration = performance.now() - (this.__duration as number);
    if (!this.isRoot && this.isLastChild) {
      await this.parent?.onFinish();
    }
  }

  private async onError(error: unknown = undefined) {
    if (error !== undefined) this.error = error;
    if (this.isRoot) {
      try {
        await this.transaction?.rollback();
      } catch (error) {
        throw new Error('ACTION_TX_ROLLBACK_ERROR');
      }
    } else {
      await this.parent?.onError(new Error('ACTION_CHILD_ERROR'));
    }
    this.status = Action.ERROR;
    this.__duration = undefined;
  }
}
