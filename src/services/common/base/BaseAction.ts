import { v4 as uuidv4 } from 'uuid';
import AuthService from '../auth/AuthService';
import { defaults } from 'lodash';
import ActionLoggerService from '../logging/ActionLoggerService';
import ActionError from '../errors/ActionError';
import { Transaction } from 'sequelize/types';

type ActionObject = {
  model: string; // Model name
  pk: string; // Model's primary key
};

export type BaseActionOptions<ParentArgsType, ParentResultType> = {
  auth: AuthService;
  throws?: boolean;
  parent?: BaseAction<ParentArgsType, ParentResultType>;
  transaction?: Transaction;
};

export type BaseActionStartOptions = {
  target?: ActionObject;
  source?: ActionObject;
  transaction?: Transaction;
};

export default abstract class BaseAction<
  ArgsType,
  ResultType,
  ParentArgsType = any,
  ParentResultType = any
> {
  id: string;
  name: string;
  abstract type: sigmate.Logger.ActionType;
  status: sigmate.Logger.ActionStatus = 'UNDEFINED';
  options: BaseActionOptions<ParentArgsType, ParentResultType>;
  logger: ActionLoggerService<ArgsType, ResultType>;

  args?: ArgsType;
  result?: ResultType;
  error?: ActionError;

  auth: AuthService;
  target?: ActionObject;
  source?: ActionObject;

  startedAt?: number;
  endedAt?: number;

  get duration() {
    if (!this.startedAt || !this.endedAt) return undefined;
    return this.endedAt - this.startedAt;
  }

  get execTime() {
    if (this.startedAt && this.endedAt) {
      return this.endedAt - this.startedAt;
    }
    return undefined;
  }

  constructor(
    name: string,
    options: BaseActionOptions<ParentArgsType, ParentResultType>
  ) {
    this.id = uuidv4();
    this.name = name;
    this.options = defaults(options, {
      throws: true,
    });
    this.auth = options.auth;
    this.logger = new ActionLoggerService(this);
  }

  abstract action(args: ArgsType | undefined): Promise<ResultType>;

  protected onStart() {
    this.status = 'STARTED';
    this.startedAt = performance.now();
    this.endedAt = undefined;
    this.logger.logActionStart();
    this.status = 'IN_PROGRESS';
  }

  public async start(
    args: ArgsType | undefined = undefined,
    options: BaseActionStartOptions
  ) {
    this.args = args;
    this.target = options.target;
    this.source = options.source;
    this.options.transaction = options.transaction;

    this.onStart();
    try {
      const result: ResultType = await this.action.bind(this)(args);
      this.result = result;
      this.onFinish();
      return result;
    } catch (error) {
      this.error = new ActionError({ origin: error });
      this.onError();
    }
  }

  protected onEnd() {
    this.endedAt = performance.now();
  }

  protected onFinish() {
    this.onEnd();
    this.status = 'FINISHED';
    this.logger.logActionFinish();
  }

  protected onError() {
    this.onEnd();
    this.status = 'ERROR';
    this.logger.logActionError();
    if (this.options.throws) throw this.error;
  }
}
