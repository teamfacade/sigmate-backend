import { Request } from 'express';
import { Model } from 'sequelize-typescript';
import { Transaction } from 'sequelize/types';
import { db } from '../services/DatabaseService';
import { logger } from '../services/logger/LoggerService';

type Worker<A, R> = (args: A) => Promise<R>;

type ActionObject = {
  /** Database model name */
  model: string;
  /** Primary key of database row */
  id?: string;
  /** A more human-friendly unique identifier for logging (e.g. `User.userName`) */
  label?: string;
};

type ActionType = 'SERVICE' | 'DATABASE' | 'HTTP';

type ActionOptions<A extends ActionContext = any, R = any> = {
  name: string;
  type?: ActionType;
  transaction?: boolean;
  target?: ActionObject['model'];
  source?: ActionObject['model'];
  metricCalculator?: (
    args: A,
    data: R,
    action: ActionState<A, R>
  ) => Record<string, number> | Promise<Record<string, number>>;
};

type ActionContext<A extends ActionContext = any, R = any> = {
  req?: Request;
  transaction?: Transaction;
  parent?: ActionState;
  action: ActionState<A, R>;
};

export type ActionArgs<T = Record<string, never>> = T & ActionContext;

type ActionStateOptions<A extends ActionContext<A, R>, R> = {
  action: Action;
  req?: Request;
  transaction?: Transaction;
  parent?: ActionState;
};

export type ActionStatus = keyof typeof ActionState['STATUS'];

export class ActionState<A extends ActionContext<A, R> = any, R = any> {
  public static STATUS = Object.freeze({
    /** Instantiated */
    INITIALIZED: 0,
    /** Starting preparations */
    STARTING: 1,
    /** Started execution of worker */
    STARTED: 2,
    /** Cleaning up */
    FINISHING: 3,
    /** Finished successfully */
    FINISHED: 4,
    /** Failed */
    FAILED: 5,
  });

  action: Action<A, R>;
  status: ActionStatus;
  __duration: number;
  get duration() {
    return this.__duration >= 0 ? this.__duration : undefined;
  }
  req?: Request;
  transaction?: Transaction;
  parent?: ActionState;
  target?: ActionObject;
  source?: ActionObject;
  error?: unknown;
  metric?: Record<string, number>;

  constructor({ action, req, transaction, parent }: ActionStateOptions<A, R>) {
    this.action = action;
    this.status = 'INITIALIZED';
    this.__duration = -1 * performance.now();
    this.parent = parent;
    this.req = req || parent?.req;
    this.transaction = transaction || parent?.transaction;

    if (action.target) {
      this.target = { model: action.target };
    }
    if (action.source) {
      this.source = { model: action.source };
    }
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  setTarget<MA extends {}, MCA extends {}>(
    target: string | number | Partial<ActionObject> | Model<MA, MCA>,
    pk?: typeof target extends Model<MA> ? keyof MA : undefined
  ) {
    if (!target) return;
    if (typeof target === 'string' || typeof target === 'number') {
      if (this.target?.model) {
        this.target.id = String(target);
      } else {
        throw new Error('Action target model not set');
      }
    } else if (target instanceof Model) {
      const modelName = target.constructor.name;
      const id = target[pk || 'id'];
      if (id === undefined || id === null) {
        throw new Error(
          'Primary key not found in action target model instance'
        );
      }

      if (this.target?.model) {
        if (this.target.model !== modelName) {
          throw new Error(
            `Unexpected action target. Expected ${this.target.model}, but got ${modelName}`
          );
        }
        this.target.id = id;
      } else {
        this.target = {
          model: modelName,
          id: id,
        };
      }
    } else {
      if (this.target?.model) {
        this.target.model = target.model || this.target.model;
        this.target.id = target.id;
      } else {
        if (target.model) {
          this.target = {
            model: target.model,
            ...target,
          };
        } else {
          throw new Error('Action target model not set');
        }
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  setSource<MA extends {}, MCA extends {}>(
    source: string | number | Partial<ActionObject> | Model<MA, MCA>,
    pk?: typeof source extends Model<MA> ? keyof MA : undefined
  ) {
    if (!source) return;
    if (typeof source === 'string' || typeof source === 'number') {
      if (this.source?.model) {
        this.source.id = String(source);
      } else {
        throw new Error('Action source model not set');
      }
    } else if (source instanceof Model) {
      const modelName = source.constructor.name;
      const id = source[pk || 'id'];
      if (id === undefined || id === null) {
        throw new Error(
          'Primary key not found in action source model instance'
        );
      }

      if (this.source?.model) {
        if (this.source.model !== modelName) {
          throw new Error(
            `Unexpected action source. Expected ${this.source.model}, but got ${modelName}`
          );
        }
        this.source.id = id;
      } else {
        this.source = {
          model: modelName,
          id: id,
        };
      }
    } else {
      if (this.source?.model) {
        this.source.model = source.model || this.source.model;
        this.source.id = source.id;
      } else {
        if (source.model) {
          this.source = {
            model: source.model,
            ...source,
          };
        } else {
          throw new Error('Action source model not set');
        }
      }
    }
  }
}

export default class Action<A extends ActionContext<A, R> = any, R = any> {
  static create<A extends ActionContext<A, R> = any, R = any>(
    worker: Worker<A, R>,
    options: ActionOptions<A, R>
  ) {
    return new Action(worker, options).run;
  }

  static DEFAULT_TYPE: ActionType = 'SERVICE';
  static DEFAULT_USE_TX = false;

  worker: Worker<A, R>;
  name: string;
  type: ActionType;
  useTx: boolean;
  target?: ActionObject['model'];
  source?: ActionObject['model'];
  metricCalculator: ActionOptions<A, R>['metricCalculator'];

  constructor(worker: Worker<A, R>, options: ActionOptions<A, R>) {
    this.worker = worker;
    const { name, type, transaction, target, source, metricCalculator } =
      options;
    this.name = name;
    this.type = type || Action.DEFAULT_TYPE;
    this.useTx = transaction || Action.DEFAULT_USE_TX;
    this.target = target;
    this.source = source;
    this.metricCalculator = metricCalculator;
  }

  public async run(options?: Omit<A, 'action'>): Promise<R> {
    const state = new ActionState({
      action: this,
      parent: options?.parent,
      req: options?.req,
      transaction: options?.transaction,
    });
    try {
      await this.start(state);
      const args = { ...options, action: state } as unknown as A;
      const data: R = await this.worker(args);
      await this.finish(true, state);
      if (this.metricCalculator) {
        const metric = this.metricCalculator(args, data, state);
        state.metric = metric instanceof Promise ? await metric : metric;
      }
      return data;
    } catch (error) {
      state.error = error;
      await this.finish(false, state);
      throw error;
    }
  }

  private async start(state: ActionState) {
    state.status = 'STARTING';
    // TODO log
    logger.log({ action: state, printStatus: true });

    if (this.useTx && !state.transaction) {
      state.transaction = await db.run((sequelize) => sequelize.transaction());
    }

    state.status = 'STARTED';
    logger.log({ action: state, printStatus: true });
    // TODO log
  }

  private async finish(success: boolean, state: ActionState) {
    state.status = 'FINISHING';
    logger.log({ action: state, printStatus: true });
    // TODO log

    const { parent, transaction: tx } = state;
    if (!parent && tx) {
      try {
        if (success) {
          await db.run(() => tx.commit());
        } else {
          await db.run(() => tx.rollback());
        }
      } catch (error) {
        if (success) {
          throw error;
        } else {
          // TODO log error
          logger.log({ error });
        }
      }
    }
    state.status = success ? 'FINISHED' : 'FAILED';
    if (state.__duration < 0) state.__duration += performance.now();
    // TODO log
    logger.log({ action: state, printStatus: true });
  }
}
