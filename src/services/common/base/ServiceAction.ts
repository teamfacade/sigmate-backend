import BaseAction, { BaseActionOptions } from './BaseAction';

export type ServiceActionOptions<ParentArgsType, ResultArgsType> =
  BaseActionOptions<ParentArgsType, ResultArgsType>;

export default abstract class ServiceAction<
  ArgsType,
  ResultType,
  ParentArgsType = any,
  ParentResultType = any
> extends BaseAction<ArgsType, ResultType, ParentArgsType, ParentResultType> {
  type: sigmate.Logger.ActionType;

  constructor(
    name: string,
    options: ServiceActionOptions<ParentArgsType, ParentResultType>
  ) {
    super(name, options);
    this.type = 'SERVICE';
  }
}
