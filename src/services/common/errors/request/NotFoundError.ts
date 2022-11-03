import RequestError from '../RequestError';

export default class NotFoundError extends RequestError {
  constructor(options: sigmate.Errors.RequestErrorOptions) {
    const { name = 'NotFoundError', ...requestErrorOptions } = options;

    super(404, { name, ...requestErrorOptions });
  }
}
