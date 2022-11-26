import BaseAction from '../base/BaseAction';
import Logger from './Logger';

type ActionLogInfo = Omit<sigmate.Logger.LogInfo, 'action'> &
  Required<Pick<sigmate.Logger.LogInfo, 'action'>>;

type ActionLogInfoBase = Omit<ActionLogInfo, 'level' | 'message'>;

export default class ActionLoggerService<A, R> extends Logger {
  action: BaseAction<A, R>;

  constructor(action: BaseAction<A, R>) {
    super();
    this.action = action;
  }

  getActionInfo(): ActionLogInfoBase {
    return {
      userId: this.action.auth.user.model?.id || -1,
      deviceId: this.action.auth.device.model?.id || -1,
      status: {
        action: this.action.status,
      },
      action: {
        id: this.action.id,
        type: this.action.type,
        name: this.action.name,
        target: this.action.target,
        source: this.action.source,
        parent: this.action.options.parent?.id,
      },
    };
  }

  logActionStart() {
    const info = this.getActionInfo();

    this.log({
      ...info,
      level: 'verbose',
      message: '',
      action: {
        ...info.action,
        // For action start, the arguments passed to the start method
        // is logged as the data field
        data: this.action.args,
      },
    });
  }

  logActionProgress(
    message: string,
    level: sigmate.Logger.LogLevel = 'verbose'
  ) {
    const info = this.getActionInfo();
    this.log({ ...info, level, message });
  }

  logActionFinish() {
    const info = this.getActionInfo();

    this.log({
      ...info,
      level: 'verbose',
      message: '',
      duration: this.action.duration,
      action: {
        ...info.action,
        // For action finish, the results of the action, returned by the
        // action mehtod, is logged as the data field
        data: this.action.result,
      },
    });
  }

  logActionError() {
    const error = this.action.error;
    if (!error) return;

    const info = this.getActionInfo();
    this.log({
      ...info,
      level: error.unexpected ? 'warn' : 'verbose',
      message: error?.message,
      action: {
        ...info.action,
        error: this.action.error,
      },
      error: this.action.error?.origin,
    });
  }
}
