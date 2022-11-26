import AuthService from './common/auth/AuthService';
import DatabaseService from './common/database/DatabaseService';
import Logger from './common/logging/Logger';

type SigmateServices = {
  logger: Logger;
  db: DatabaseService;
  auth: {
    system: AuthService;
  };
};

/**
 * A global object for other modules to use when importing services
 */
const services: SigmateServices = {
  logger: undefined as unknown as Logger,
  db: undefined as unknown as DatabaseService,
  auth: undefined as unknown as SigmateServices['auth'],
};

export const setService = <T extends keyof SigmateServices>(
  key: T,
  service: typeof services[T]
) => {
  services[key] = service;
};

/**
 * Check if all services have been initialized and set
 * @param throws Whether to throw an error on check fail
 * @returns `true` if check passes, `false` otherwise
 * @throws Error if check fails
 */
export const checkServices = (throws = true) => {
  for (const k in services) {
    if (!services[k as keyof typeof services]) {
      if (throws) {
        throw new Error('SERVICES_NOT_INIT');
      }
      return false;
    }
  }
  return true;
};

export default services;
