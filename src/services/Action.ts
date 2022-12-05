import { Transaction, ModelStatic, Model, Identifier } from 'sequelize/types';
import { ActionStatus } from '../utils/status';
import Database from './Database';
import Logger from './logger';
import ActionError from './errors/ActionError';
import ServerError from './errors/ServerError';

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

type ActionOptions<
  TPKT extends Identifier,
  SPKT extends Identifier,
  PTPKT extends Identifier,
  PSPKT extends Identifier
> = {
  type?: typeof ActionTypes[keyof typeof ActionTypes];
  /** Name of the action (for logging) */
  name: string;
  /** Auth instance to authorize the action with */
  // TODO auth: AuthService
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
  parent?: Action<PTPKT, PSPKT>;
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
  logger: Logger;
  httpStatusCode?: number;
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

  __target?: ActionObject<TPKT>;
  get target() {
    return this.__target?.id ? this.__target : undefined;
  }
  set target(value) {
    this.__target = value;
  }
  __source?: ActionObject<SPKT>;
  get source() {
    return this.__source?.id ? this.__source : undefined;
  }
  set source(value) {
    this.__source = value;
  }
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
  depth: number;

  constructor(options: ActionOptions<TPKT, SPKT, PTPKT, PSPKT>) {
    const { type, name, transaction, isLastChild, target, source, parent } =
      options;
    this.type = type || Action.TYPE.SERVICE;
    this.name = name;
    this.status = Action.STATE.INITIALIZED;
    this.database = parent ? parent.database : new Database();
    this.logger = parent ? parent.logger : new Logger();
    // TODO this.auth = parent ? parent.auth : options.auth;
    this.isLastChild = isLastChild;
    this.target = target;
    this.source = source;
    this.depth = 0;
    if (parent) {
      this.isManagedTx = false;
      this.transaction = parent.transaction;
      this.parent = parent;
      parent.children.push(this);
      this.depth = parent.depth + 1;
    }
    if (transaction) {
      if (typeof transaction === 'boolean') {
        if (!parent) this.isManagedTx = true;
      } else {
        this.isManagedTx = false;
        this.transaction = parent?.transaction || transaction;
      }
    }
  }

  public async start() {
    if (this.parent && !this.parent.started) await this.parent.start();
    this.__duration = performance.now();
    if (this.isManagedTx && !this.transaction) {
      try {
        this.transaction = await this.database.sequelize.transaction();
      } catch (error) {
        this.onError({ type: 'TX START FAILED', error });
      }
    }
    this.status = Action.STATE.STARTED;
    this.logger.log({ action: this });
  }

  public setTarget(target: Partial<ActionObject<TPKT>>) {
    const model = this.__target?.model || target.model;
    if (model) {
      this.target = {
        model,
        id: this.target?.id || target.id,
      };
    } else {
      this.onError({
        message: 'Cannot set target. Set target model first.',
      });
    }
  }

  public setSource(source: Partial<ActionObject<SPKT>>) {
    const model = this.__source?.model || source.model;
    if (model) {
      this.source = {
        model,
        id: this.source?.id || source.id,
      };
    } else {
      this.onError({
        message: 'Cannot set source. Set source model first.',
      });
    }
  }

  public async run<T>(
    worker: (
      transaction: typeof this.transaction,
      action: typeof this
    ) => Promise<T>
  ) {
    if (this.ended) {
      this.onError({ type: 'ALREADY ENDED' });
    }
    if (this.parent?.ended) {
      this.onError({ type: 'PARENT ALREADY ENDED' });
    }
    if (!this.started) await this.start();
    // TODO Authorize action
    let res: Awaited<ReturnType<typeof worker>>;
    try {
      if (this.type === Action.TYPE.DATABASE) {
        res = await this.database.run(() => worker(this.transaction, this));
      } else {
        res = await worker(this.transaction, this);
      }
      await this.onFinish();
      return res;
    } catch (error) {
      this.onError({ error });
    }
  }

  private onEnd() {
    this.__duration = performance.now() - (this.__duration as number);
  }

  private async onFinish() {
    if (this.status === Action.STATE.FINISHED) return;
    if (!this.parent) {
      try {
        await this.transaction?.commit();
      } catch (error) {
        this.onError({ type: 'TX COMMIT FAILED', error });
      }
    }
    this.status = Action.STATE.FINISHED;
    this.onEnd();
    this.logger.log({ action: this });
    if (this.parent && this.isLastChild) {
      await this.parent.onFinish();
    }
  }

  public onError(options: sigmate.Error.HandlerOptions<ErrorTypes>): never {
    this.status = Action.STATE.FAILED;

    const { type, error: cause } = options;
    let message = options.message;
    const critical = true;
    let level: sigmate.Logger.Level | undefined = undefined;
    if (cause instanceof ServerError) {
      if (cause.level) level = cause.level;
    }
    if (cause instanceof ActionError) {
      if (cause.action?.name) {
        message =
          `Child action '${cause.action.name}' failed` +
          (message ? ` ${message}` : '');
      }
    }

    switch (type) {
      case 'ALREADY ENDED':
        message = 'Action already ended.';
        break;
      case 'PARENT ALREADY ENDED':
        if (this.parent) {
          message = `Parent action '${this.parent.name}' already ended`;
        } else {
          message = `Received 'PARENT ALREADY ENDED', but parent action not found.`;
          level = 'warn';
        }
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
        break;
      default:
        message = message || 'Unexpected ActionError';
        break;
    }

    const error = new ActionError({
      level,
      message,
      critical,
      action: this,
      cause,
      status: this.httpStatusCode,
    });

    this.onEnd();
    if (!this.parent) {
      // Parents
      if (this.transaction?.rollback && type !== 'TX ROLLBACK FAILED') {
        this.transaction
          .rollback()
          .then(() => {
            this.logger.log({ error });
          })
          .catch((error) => {
            this.onError({ type: 'TX ROLLBACK FAILED', error });
          });
      } else {
        this.logger.log({ error });
      }
    } else {
      this.logger.log({ action: this });
    }
    throw error;
  }
}
