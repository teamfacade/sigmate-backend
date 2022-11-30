import ServerError, { ServerErrorOptions } from './ServerError';

type DatabaseErrorOptions = Omit<ServerErrorOptions, 'name'>;

export default class DatabaseError extends ServerError {
  constructor(options: DatabaseErrorOptions) {
    super({ name: 'DatabaseError', ...options });
  }
}
