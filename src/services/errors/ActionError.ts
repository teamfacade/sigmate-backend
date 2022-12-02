import { Identifier } from 'sequelize/types';
import Action from '../Action';
import RequestError, { RequestErrorOptions } from './RequestError';

interface ActionErrorOptions<
  TPKT extends Identifier = number,
  SPKT extends Identifier = number,
  PTPKT extends Identifier = TPKT,
  PSPKT extends Identifier = SPKT
> extends Omit<RequestErrorOptions, 'name'> {
  action: Action<TPKT, SPKT, PTPKT, PSPKT>;
}

export default class ActionError<
  TPKT extends Identifier = number,
  SPKT extends Identifier = number,
  PTPKT extends Identifier = TPKT,
  PSPKT extends Identifier = SPKT
> extends RequestError {
  action: Action<TPKT, SPKT, PTPKT, PSPKT>;
  logData?: Record<string, unknown>;
  constructor(options: ActionErrorOptions<TPKT, SPKT, PTPKT, PSPKT>) {
    const { action, ...rest } = options;
    super({
      name: 'ActionError',
      ...rest,
    });
    this.action = action;
  }
}
