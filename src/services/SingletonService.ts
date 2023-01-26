import Service, { ServiceOptions } from '.';
import ServiceError from './errors/ServiceError';

export default class SingletonService extends Service {
  /** Singleton service instance */
  public static instance: SingletonService;

  constructor(options: ServiceOptions) {
    super(options);

    const __class = this.constructor as unknown as typeof SingletonService;
    if (__class.instance) {
      throw new ServiceError({ code: 'SERVICE/CF_ALREADY_INIT' });
    }
    __class.instance = this;
  }
}
