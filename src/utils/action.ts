import { Request } from 'express';
import { Model } from 'sequelize-typescript';
import { Transaction } from 'sequelize/types';
import ServerError from '../errors';
import ActionError from '../errors/action';
import DatabaseError from '../errors/database';
import { db } from '../services/database';
import { logger } from '../services/logger';

type ActionOptions = {
  name: string;
  type?: 'DB' | 'COMPLEX' | 'HTTP';
  parent?: Action;
  req?: Request;
  transaction?: boolean | Transaction;
};

export type ActionArgs = {
  req?: Request;
  transaction?: Transaction;
  action?: Action;
  parentAction?: Action;
};

export default class Action {
  name: ActionOptions['name'];
  type: ActionOptions['type'];
  status: sigmate.TaskStatus;
  __duration: number;
  get duration() {
    return this.__duration >= 0 ? this.__duration : undefined;
  }
  target: sigmate.Log.ActionTarget[];
  parent?: Action;
  req?: Request;
  transaction?: Transaction;
  private startTx?: boolean;

  constructor(options: ActionOptions['name'] | ActionOptions) {
    if (typeof options === 'string') {
      this.name = options;
    } else {
      const { name, type, parent, req, transaction } = options;
      this.name = name;
      this.type = type || 'DB';
      if (parent) {
        this.req = parent.req;
        this.transaction = parent.transaction;
      } else {
        this.req = req;
        if (typeof transaction === 'boolean') {
          this.startTx = true;
        } else {
          this.transaction = transaction;
        }
      }
    }
    this.status = 'STARTED';
    this.__duration = performance.now() * -1;
    this.target = [];
  }

  public async start() {
    if (this.startTx) {
      try {
        this.transaction = await db.sequelize.transaction();
      } catch (error) {
        throw new DatabaseError({ error });
      }
    }
    this.logStart();
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  public addTarget<MA extends {}, MCA extends {}>(
    target: sigmate.Log.ActionTarget | Model<MA, MCA>,
    pk?: typeof target extends Model<MA, MCA> ? keyof MA : undefined
  ) {
    if (target instanceof Model) {
      if (!target) return;
      const modelName = target.constructor.name;
      const id = target[pk || 'id'];
      if (id === null || id === undefined) {
        throw new Error(
          'Primary key not found in action target model instance'
        );
      }
      this.target.push({
        model: modelName,
        id: String(id),
      });
    } else {
      this.target.push(target);
    }
  }

  public async finish(options: { success: boolean; error?: unknown }) {
    let { success, error } = options;
    this.__duration += performance.now();
    this.status = success ? 'SUCCESS' : 'FAILED';

    if (this.transaction && !this.parent) {
      if (success) {
        try {
          await this.transaction.commit();
        } catch (err) {
          success = false;
          this.status = 'FAILED';
          error = err;
        }
      }
      if (!success) {
        try {
          await this.transaction.rollback();
        } catch (err) {
          logger.log({
            level: 'warn',
            source: 'Action',
            event: 'ACT/WARNING',
            name: this.name,
            status: this.status,
            user: this.req?.getLogUser && this.req.getLogUser(),
            device: this.req?.getLogDevice && this.req.getLogDevice(),
            error: err,
          });
        }
      }
    }

    this.logFinish(error);
  }

  private logStart() {
    logger.log({
      level: 'debug',
      source: 'Action',
      event: 'ACT/START',
      name: this.name,
      status: this.status,
      user: this.req?.getLogUser && this.req.getLogUser(),
      device: this.req?.getLogDevice && this.req.getLogDevice(),
    });
  }

  private logFinish(error: unknown = undefined) {
    logger.log({
      level: 'verbose',
      source: 'Action',
      event: 'ACT/FINISH',
      name: this.name,
      status: this.status,
      duration: this.duration,
      user: this.req?.getLogUser && this.req.getLogUser(),
      device: this.req?.getLogDevice && this.req.getLogDevice(),
      error: error instanceof ActionError ? undefined : error,
    });
  }
}

const __ActionMethod = (options?: ActionOptions['name'] | ActionOptions) => {
  return (target: any, key: string, desc?: PropertyDescriptor) => {
    const defaultActionName = `${target.constructor.name}/${String(key)}`;
    const method = desc?.value || target[key];
    const wrapped = async function (args: Record<string, any> & ActionArgs) {
      let opts: ActionOptions;
      if (typeof options === 'string') {
        opts = {
          name: options || defaultActionName,
        };
      } else if (options) {
        opts = options;
      } else {
        opts = {
          name: defaultActionName,
        };
      }

      if (args.parentAction) {
        opts.parent = args.parentAction;
      } else {
        opts.req = args.req;
        opts.transaction = args.transaction;
      }
      const action = new Action(opts);
      try {
        if (!args) args = {};
        args.action = action;
        args.transaction = action.transaction;
        args.req = action.req;
        action.start();

        // TODO Check how to safely type decorators
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const result = method.apply(this, [args]);
        if (result instanceof Promise) await result;
        action.finish({ success: true });
        return result;
      } catch (err) {
        action.finish({ success: false, error: err });
        let error: ServerError;
        if (err instanceof ActionError) {
          error = err;
        } else {
          error = new ActionError({ code: 'ACTION/FAILED', error: err });
        }
        throw error;
      }
    };

    desc?.value ? (desc.value = wrapped as any) : (target[key] = wrapped);
  };
};

export function ActionMethod(
  options: ActionOptions['name'] | ActionOptions
): void | any;
export function ActionMethod(
  target: any,
  key: string,
  desc?: PropertyDescriptor
): void;
export function ActionMethod(...args: any[]): void | any {
  if (args.length >= 2) {
    __ActionMethod()(args[0], args[1], args[2]);
    return;
  }
  return (target: any, key: string, desc?: PropertyDescriptor) => {
    __ActionMethod(args[0])(target, key, desc);
  };
}
