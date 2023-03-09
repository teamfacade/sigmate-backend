import { Request } from 'express';
import { Model } from 'sequelize-typescript';
import { Transaction } from 'sequelize/types';
import ActionError from '../errors/action';
import { logger } from '../services/logger';

type ActionOptions = {
  name: string;
  type?: 'DB' | 'COMPLEX' | 'HTTP';
  context?: any;
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
  context?: any;
  status: sigmate.TaskStatus;
  __duration: number;
  get duration() {
    return this.__duration >= 0 ? this.__duration : undefined;
  }
  target: sigmate.Log.ActionTarget[];
  parent?: Action;
  req?: Request;

  constructor(options: ActionOptions['name'] | ActionOptions) {
    if (typeof options === 'string') {
      this.name = options;
    } else {
      const { name, type, context } = options;
      this.name = name;
      this.type = type || 'DB';
      this.context = context;
    }
    this.status = 'STARTED';
    this.__duration = performance.now() * -1;
    this.target = [];
  }

  public start() {
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

  public finish(options: { success: boolean; error?: unknown }) {
    const { success, error } = options;
    this.__duration += performance.now();
    this.status = success ? 'SUCCESS' : 'FAILED';
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
      const action = new Action(options || defaultActionName);
      try {
        if (!args) args = {};
        action.parent = args.parentAction;
        action.req = args.req;
        args.action = action;
        action.start();
        // TODO Check how to safely type decorators
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const result = method.apply(this, [args]);
        if (result instanceof Promise) await result;
        action.finish({ success: true });
        return result;
      } catch (error) {
        action.finish({ success: false, error });
        if (error instanceof ActionError) throw error;
        throw new ActionError({ code: 'ACTION/FAILED', error });
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
