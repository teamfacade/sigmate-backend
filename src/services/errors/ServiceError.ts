import { AllErrorCode, ServiceErrorCode } from '.';
import ServerError, { ServerErrorOptions } from './ServerError';

export default class ServiceError<
  ErrorCode extends AllErrorCode = ServiceErrorCode
> extends ServerError {
  constructor(options: ServerErrorOptions<ErrorCode>) {
    super({
      ...options,
      name: 'ServiceError',
    });
  }
}
