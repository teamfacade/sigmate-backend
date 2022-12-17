import { Transaction, ModelStatic, Model, Identifier } from 'sequelize/types';
import { ActionStatus } from '../utils/status';
import Database from './Database';
import Logger from './logger';
import ActionError from './errors/ActionError';
import ServerError from './errors/ServerError';
import { Request } from 'express';
import User from './auth/User';
import UserModel from '../models/User.model';
import { Authorizer } from './auth';

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
  instance?: M;
};

export type ActionMetricLike = number | Record<string, number>;

type ActionOptions<
  MetricType extends ActionMetricLike,
  TPKT extends Identifier,
  SPKT extends Identifier,
  PTPKT extends Identifier,
  PSPKT extends Identifier
> = {
  type?: typeof ActionTypes[keyof typeof ActionTypes];
  /** Name of the action (for logging) */
  name: string;
  /** Auth instance to authorize the action with */
  req?: Request;
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
  /**
   * Set it to `true` to log action finish to analyticsLogger. Set it to `false` for
   * Optionally, supply a valid string level to use as the logging level when this action finishes.
   */
  analytics?: boolean | sigmate.Logger.Level;
  subject?: User;
  target?: ActionObject<TPKT>;
  source?: ActionObject<SPKT>;
  parent?: Action<MetricType, PTPKT, PSPKT>;
  auth?:
    | Authorizer<MetricType, TPKT, SPKT, PTPKT, PSPKT>
    | Authorizer<MetricType, TPKT, SPKT, PTPKT, PSPKT>[];
};

export type ActionWorkerParams<
  MetricType extends ActionMetricLike,
  TPKT extends Identifier,
  SPKT extends Identifier,
  PTPKT extends Identifier,
  PSPKT extends Identifier
> = {
  transaction?: Transaction;
  action: Action<MetricType, TPKT, SPKT, PTPKT, PSPKT>;
};

export type ActionDTO<T> = T & {
  req?: Request;
  user?: User;
};

export default class Action<
  MetricType extends ActionMetricLike = number,
  TargetPkType extends Identifier = number,
  SourcePkType extends Identifier = number,
  ParentTPkT extends Identifier = TargetPkType,
  ParentSPkT extends Identifier = SourcePkType
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
  static DEFAULT_LEVEL: sigmate.Logger.Level = 'verbose';
  static logger?: Logger;

  type: typeof ActionTypes[keyof typeof ActionTypes];
  name: string;
  database: Database;
  logger?: Logger;
  /**
   * Additional data to write to the logs for debugging
   */
  data?: Record<string, unknown>;
  metric?: MetricType;
  /**
   * Default logging level to use for action finish
   */
  level: sigmate.Logger.Level = Action.DEFAULT_LEVEL;

  status: typeof ActionStatus[keyof typeof ActionStatus];
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

  /** Who is running this action? */
  subject?: User;

  __target?: ActionObject<TargetPkType>;
  get target() {
    return this.__target?.id ? this.__target : undefined;
  }
  set target(value) {
    this.__target = value;
    if (this.__target?.instance) {
      const model = this.__target.instance as any;
      if (model?.id !== undefined) {
        this.__target.id = model.id;
      }
    }
  }
  __source?: ActionObject<SourcePkType>;
  get source() {
    return this.__source?.id ? this.__source : undefined;
  }
  set source(value) {
    this.__source = value;
    if (this.__source?.instance) {
      const model = this.__source.instance as any;
      if (model?.id !== undefined) {
        this.__source.id = model.id;
      }
    }
  }
  // Compound actions (actions consisting of multiple sub-actions)
  /**
   * The parent action that spawned this action
   */
  parent?: Action<MetricType, ParentTPkT, ParentSPkT>;
  /**
   * Children action spawned by this action
   */
  children: Action<any, any, any>[] = [];
  /**
   * When set as `true`, and this action is not the root action,
   * the parent action of this action will finish when this action finishes
   */
  isLastChild?: boolean;
  /**
   * How many parents are there
   */
  depth: number;

  // AUTH
  authorizers: Authorizer<
    MetricType,
    TargetPkType,
    SourcePkType,
    ParentTPkT,
    ParentSPkT
  >[];
  completedAuthorizers: Set<string>;

  constructor(
    options: ActionOptions<
      MetricType,
      TargetPkType,
      SourcePkType,
      ParentTPkT,
      ParentSPkT
    >
  ) {
    const {
      type,
      name,
      transaction,
      isLastChild,
      target,
      source,
      parent,
      analytics,
      req,
      auth,
    } = options;
    this.type = type || Action.TYPE.SERVICE;
    this.name = name;
    this.status = Action.STATE.INITIALIZED;
    this.database = parent ? parent.database : new Database();
    this.logger = Action.logger;
    this.isLastChild = isLastChild;
    this.target = target;
    this.source = source;
    this.depth = 0;

    if (auth instanceof Array) {
      this.authorizers = auth;
    } else if (auth) {
      this.authorizers = [auth];
    } else {
      this.authorizers = [];
    }

    if (parent) {
      // Child
      this.isManagedTx = false;
      this.transaction = parent.transaction;
      this.parent = parent;
      parent.children.push(this);
      this.depth = parent.depth + 1;
      this.subject = parent.subject;
      this.completedAuthorizers = parent.completedAuthorizers;
    } else {
      // Parent (root)
      this.completedAuthorizers = new Set<string>();

      if (req) {
        this.subject = req.user;
      }
    }
    if (transaction) {
      if (typeof transaction === 'boolean') {
        if (!parent) this.isManagedTx = true;
      } else {
        this.isManagedTx = false;
        this.transaction = parent?.transaction || transaction;
      }
    }
    if (analytics) {
      if (typeof analytics === 'boolean') {
        this.level = analytics ? Action.DEFAULT_LEVEL : 'debug';
      } else if (typeof analytics === 'string') {
        this.level = analytics;
      }
    }
  }

  public setSubject(dto: { user?: User; model?: UserModel }) {
    const { user: subject, model } = dto;
    if (subject) this.subject = subject;
    if (model) this.subject = new User({ model });
  }

  public setTarget(target: Partial<ActionObject<TargetPkType>>) {
    const model = this.__target?.model || target.model;
    if (model) {
      this.target = {
        model,
        id: this.target?.id || target.id,
      };
    } else {
      throw new ActionError({
        code: 'ACTION/CF_SET_TARGET',
        message: 'Set target model first.',
      });
    }
  }

  public setSource(source: Partial<ActionObject<SourcePkType>>) {
    const model = this.__source?.model || source.model;
    if (model) {
      this.source = {
        model,
        id: this.source?.id || source.id,
      };
    } else {
      throw new ActionError({
        code: 'ACTION/CF_SET_SOURCE',
        message: 'Set source model first.',
      });
    }
  }

  public setMetric(metric: MetricType) {
    this.metric = metric;
  }

  private authorize(options: { after: boolean }) {
    this.authorizers.forEach((authorizer) => {
      const { name, check, once, after = false } = authorizer;
      // For authorizers run before/after the action has ended
      if (after !== options.after) return;
      // If already authorized, don't check again
      if (once && this.completedAuthorizers.has(name)) return;
      if (check(this)) {
        // Attempt to authorize
        // Success (Authorized)
        if (once) this.completedAuthorizers.add(name);
      } else {
        // Failed (Unauthorized)
        throw new ActionError({
          code: 'ACTION/RJ_UNAUTHORIZED',
          message: `Unauthorized by '${name}' check (${
            options.after ? 'after' : 'before'
          })`,
        });
      }
    });
  }

  /**
   * Prepare to start the action
   * * Check if this, or the parent has already ended (finished/failed)
   * * Start the parent (if not done so already)
   * * Record starting time
   * * Start transaction (if needed)
   * * Authorize the action
   */
  public async start() {
    // Ended actions (or their children) cannot be started
    if (this.ended) {
      throw new ActionError({ code: 'ACTION/NA_ENDED' });
    }
    if (this.parent?.ended) {
      throw new ActionError({ code: 'ACTION/NA_PARENT_ENDED' });
    }

    // Start parent first
    if (this.parent && !this.parent.started) await this.parent.start();

    // Mark starting time
    this.__duration = performance.now();

    // Log action start
    this.status = Action.STATE.STARTED;
    this.logger?.log({ action: this });

    // Start transaction
    if (this.isManagedTx && !this.transaction) {
      try {
        this.transaction = await this.database.sequelize.transaction();
      } catch (error) {
        throw new ActionError({ code: 'ACTION/ER_TX_START', error });
      }
    }

    // Authorize the action to run
    this.authorize({ after: false });
  }

  public async run<T>(
    worker: (
      args: ActionWorkerParams<
        MetricType,
        TargetPkType,
        SourcePkType,
        ParentTPkT,
        ParentSPkT
      >
    ) => Promise<T>
  ) {
    try {
      // Prepare start
      if (!this.started) await this.start();
      // Run the action
      let res: Awaited<ReturnType<typeof worker>>;
      if (this.type === Action.TYPE.DATABASE) {
        res = await this.database.run(() =>
          worker({ transaction: this.transaction, action: this })
        );
      } else {
        res = await worker({ transaction: this.transaction, action: this });
      }
      // Clean up (on success)
      await this.onFinish();
      // Return the results
      return res;
    } catch (error) {
      // Clean up (on fail)
      this.onError();
      // Throw the error
      if (error instanceof ServerError) throw error;
      throw new ActionError({ code: 'ACTION/ER_RUN_FAILED', error });
    }
  }

  /**
   * Run when action both finishes(success) or fails
   * * Mark action duration
   * * Log action end (finish/fail)
   */
  private onEnd() {
    this.__duration = performance.now() - (this.__duration as number);
    this.logger?.log({ action: this });
  }

  /**
   * Clean up after finishing the action
   * * Commit transaction
   * * Authorize the action
   * * Finish the parent if this is the last child
   */
  private async onFinish() {
    // No need to run again
    if (this.status === Action.STATE.FINISHED) return;

    // Final checks on authorization
    // Errors will be handled from `run()`, the caller
    this.authorize({ after: true });

    // Commit the transaction
    if (!this.parent) {
      try {
        await this.transaction?.commit();
      } catch (error) {
        throw new ActionError({ code: 'ACTION/ER_TX_COMMIT', error });
      }
    }

    // Log action finish
    this.status = Action.STATE.FINISHED;
    this.onEnd();

    // Finish parent if last child
    if (this.parent && this.isLastChild) {
      await this.parent.onFinish();
    }
  }

  /**
   * Clean up action on error
   */
  public onError(options: { rollback?: boolean } = {}) {
    const { rollback = true } = options;
    this.status = Action.STATE.FAILED;
    if (!this.parent) {
      // Parents: Rollback transaction (if started)
      if (rollback && this.transaction) {
        this.transaction
          .rollback()
          .then(() => this.onEnd())
          .catch((error) => {
            this.logger?.log({
              error: new ActionError({ code: 'ACTION/ER_TX_ROLLBACK', error }),
            });
            this.onError({ rollback: false });
          });
      } else {
        this.onEnd();
      }
    }
  }
}
