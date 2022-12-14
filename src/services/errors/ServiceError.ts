import ServerError, { ServerErrorOptions } from './ServerError';

export interface ServiceErrorOptions
  extends Omit<ServerErrorOptions, 'name' | 'label'> {
  name?: ServerErrorOptions['name'];
  serviceName?: NonNullable<ServerErrorOptions['label']>['name'];
}

export type ServiceErrorHelperOptions = Omit<
  ServiceErrorOptions,
  'name' | 'serviceName'
>;

export default class ServiceError extends ServerError {
  constructor(options: ServiceErrorOptions) {
    const { name, serviceName = 'SERVICE', ...rest } = options;
    super({
      name: name || 'ServiceError',
      label: {
        source: 'SERVICE',
        name: serviceName,
      },
      ...rest,
    });
  }
}
