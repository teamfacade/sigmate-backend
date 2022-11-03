import RequestError from '../RequestError';

export default class BadRequestError extends RequestError {
  validationErrors?: sigmate.Errors.ValidationError[];

  constructor(options: sigmate.Errors.BadRequestErrorOptions) {
    const {
      validationErrors,
      name = 'BadRequestError',
      ...requestErrorOptions
    } = options;
    super(400, { name, ...requestErrorOptions });
    this.validationErrors = validationErrors;
  }
}
