import Action from '../base/BaseActionNew';
import Logger from './Logger';

type ActionLogInfo = Omit<sigmate.Logger.LogInfo, 'action'> &
  Required<Pick<sigmate.Logger.LogInfo, 'action'>>;

type ActionLogInfoBase = Omit<ActionLogInfo, 'level' | 'message'>;

export default class ActionLogger extends Logger {
  static STATUS: Record<number, sigmate.Logger.ActionStatus> = {
    0: 'NOT STARTED',
    1: 'STARTED',
    2: 'FINISHED',
    3: 'ERROR',
  };

  static TYPE: Record<number, sigmate.Logger.ActionType> = {
    0: 'DATABASE',
    1: 'SERVICE',
  };

  action: Action;
  constructor(action: Action) {
    super();
    this.action = action;
  }

  getInfo(): ActionLogInfoBase {
    const action = this.action;
    return {
      userId: action.userModel?.id || -1,
      deviceId: action.deviceModel?.id || -1,
      status: {
        action: ActionLogger.STATUS[action.status],
      },
      action: {
        type: ActionLogger.TYPE[action.type],
        id: action.id,
        name: action.name,
        target: action.target?.pk
          ? {
              model: action.target.model.name,
              pk: action.target.pk.toString(),
            }
          : undefined,
      },
    };
  }
}
