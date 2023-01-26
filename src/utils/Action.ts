import { Request } from 'express';
import { Transaction } from 'sequelize/types';
import { db } from '../services/DatabaseService';
import { logger } from '../services/logger/LoggerService';

type ActionOptions<ArgsType, ReturnType> = {
  name: string;
  type?: sigmate.Action.Type;
  transaction?: boolean;
  target?: ActionObject['model'];
  source?: ActionObject['model'];
  calculateMetric?: ActionMetricCalulator<ArgsType, ReturnType>;
};

export type ActionStatus = keyof typeof Action['STATUS'];
type ActionObject = {
  /** Database model name */
  model: string;
  /** Primary key of database row */
  id?: string;
};

export type ActionState<ArgsType = any, ReturnType = any> = {
  name: Action<ArgsType, ReturnType>['name'];
  type: Action<ArgsType, ReturnType>['type'];
  status: ActionStatus;
  duration: number;
  req?: Request;
  transaction?: Transaction;
  parent?: ActionState;
  target?: ActionObject;
  source?: ActionObject;
  data?: ReturnType;
  error?: unknown;
  metrics?: Record<string, number>;
};

export type ActionWorkerOptions<ArgsType = any, ReturnType = any> = {
  /** State of the current action */
  action: ActionState<ArgsType, ReturnType>;
  /** Shorthand property for `action.transaction` */
  transaction: ActionState<ArgsType, ReturnType>['transaction'];
};

type ActionRunOptions<PArgsType, PReturnType> = {
  /** State of parent that spawned this action. Overrides `.req` and `.transaction`. */
  parent?: ActionState<PArgsType, PReturnType>;
  /** Request that spawned this action. Ignored when `.parent` is set. */
  req?: Request;
  /** Transaction to use when running this action. Ignored when `.parent` is set. */
  transaction?: Transaction;
};

type ActionWorker<ArgsType, ReturnType> = (
  args: ArgsType,
  options: ActionWorkerOptions<ArgsType, ReturnType>
) => Promise<ReturnType>;

type ActionMetricCalulator<ArgsType, ReturnType> = (
  args: ArgsType,
  data: ReturnType
) => NonNullable<ActionState['metrics']>;

// Method Decorator
export default class Action<ArgsType = unknown, ReturnType = unknown> {
  static create<ArgsType, ReturnType>(
    worker: ActionWorker<ArgsType, ReturnType>,
    options: ActionOptions<ArgsType, ReturnType>
  ) {
    return new Action(worker, options).run;
  }

  public static STATUS = Object.freeze({
    /** Instantiated */
    INITIALIZED: 0,
    /** Starting preparations */
    STARTING: 1,
    /** Started execution of worker */
    STARTED: 2,
    /** Finished successfully */
    FINISHED: 3,
    /** Failed */
    FAILED: 4,
  });

  public name: string;
  public type: sigmate.Action.Type;
  public target?: ActionObject;
  public source?: ActionObject;
  public calculateMetric?: ActionMetricCalulator<ArgsType, ReturnType>;
  private worker: ActionWorker<ArgsType, ReturnType>;
  private useTx: boolean;

  constructor(
    worker: ActionWorker<ArgsType, ReturnType>,
    options: ActionOptions<ArgsType, ReturnType>
  ) {
    const { name, transaction, type, target, source, calculateMetric } =
      options;

    this.name = name;
    this.worker = worker;
    this.type = type || 'SERVICE';
    this.useTx = transaction || false;
    if (target) this.target = { model: target };
    if (source) this.source = { model: source };
    this.calculateMetric = calculateMetric;
  }

  public async run(
    args: ArgsType,
    options: ActionRunOptions<ArgsType, ReturnType> = {}
  ) {
    const state: ActionState<ArgsType, ReturnType> = {
      name: this.name,
      type: this.type,
      status: 'INITIALIZED',
      duration: -1 * performance.now(),
      req: options.parent?.req || options.req,
      transaction: options.parent?.transaction || options.transaction,
      parent: options.parent,
      target: this.target,
      source: this.source,
    };

    try {
      await this.start(state);
      let data: ReturnType;
      const workerOptions = { action: state, transaction: state.transaction };
      if (this.type === 'DATABASE') {
        data = await db.run(() => this.worker(args, workerOptions));
      } else {
        data = await this.worker(args, workerOptions);
      }
      state.data = data;
      if (this.calculateMetric) {
        state.metrics = this.calculateMetric(args, data);
      }
      await this.finish(true, state);
      return data;
    } catch (error) {
      await this.finish(false, state);
      throw error;
    }
  }

  private async start(state: ActionState<ArgsType, ReturnType>) {
    state.status = 'STARTING';
    logger.log({ action: state, printStatus: true });

    if (this.useTx && !state.transaction) {
      try {
        state.transaction = await db.run((sequelize) =>
          sequelize.transaction()
        );
        state.status = 'STARTED';
      } catch (error) {
        state.status = 'FAILED';
        state.error = error;
      }
    }
    logger.log({ action: state, printStatus: true });
  }

  private async finish(
    success: boolean,
    state: ActionState<ArgsType, ReturnType>
  ) {
    const { parent, transaction } = state;
    if (!parent && transaction) {
      try {
        if (success) {
          await db.run(() => transaction.commit());
        } else {
          await db.run(() => transaction.rollback());
        }
      } catch (error) {
        state.error = error;
        state.status = 'FAILED';
        success = false;
        // Don't throw
      }
    }
    state.status = success ? 'FINISHED' : 'FAILED';
    state.duration += performance.now();

    if (state.error) logger.log({ action: state, error: state.error });
    logger.log({ action: state, printStatus: true });
  }
}
