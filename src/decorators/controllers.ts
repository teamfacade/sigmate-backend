import { NextFunction, Request, Response } from 'express';
import {
  validationResult,
  body,
  query,
  param,
  ValidationChain,
} from 'express-validator';
import AuthMiddleware from '../middlewares/auth';
import ExpressValidator, {
  getValiadtionFactory,
  getValidationChain,
  ValidationChainFactory,
  ValidationChainNamesOf,
  ValidationFactoryNamesOf,
} from '../middlewares/validators/express';
import ServerError from '../services/errors/ServerError';
import { EController } from '../utils/RequestUtil';
import { MethodDecorator } from '.';

function getController(
  target: any,
  key: string,
  desc: PropertyDescriptor | undefined
) {
  return desc?.value || target[key];
}

function getControllers(
  target: any,
  key: string,
  desc: PropertyDescriptor | undefined
) {
  return getController(target, key, desc) as unknown as
    | EController
    | EController[];
}

type ExpressControllerOptions = {
  notify?: boolean;
};

export function Controller(options: ExpressControllerOptions): void | any;
export function Controller(
  target: any,
  key: string,
  desc?: PropertyDescriptor
): void;
export function Controller(...args: any[]): any | void {
  // Decorator can be used both as an expression and a callable
  if (args.length >= 2) {
    const target = args[0];
    const key = args[1];
    const desc = args[2];
    __Controller()(target, key, desc);
    return;
  }

  return (target: any, key: string, desc?: PropertyDescriptor) => {
    __Controller(args[0])(target, key, desc);
  };
}

/**
 * Decorator factory for Express JS controller error handling
 * @param notify Always set the notify flag to true for server errors
 * @returns Decorator for Express JS controller
 */
function __Controller({ notify }: { notify?: boolean } = {}): MethodDecorator {
  return (target, key, desc) => {
    const controller = getController(target, key, desc);
    if (typeof controller !== 'function') {
      throw new Error(
        'Not a valid controller. ExpressController decorator must be the last decorator'
      );
    }

    const wrapped: EController = async (req, res, next) => {
      try {
        const returned = controller(req, res, next);
        if (returned instanceof Promise) {
          await returned;
        }
        if (!res.headersSent) {
          throw new Error(
            'Controller logic error. Controller never sends a response'
          );
        }
      } catch (error) {
        if (notify !== undefined && error instanceof ServerError) {
          error.notify = notify;
        }
        next(error);
      }
    };

    desc?.value ? (desc.value = wrapped) : (target[key] = wrapped);
  };
}

type LocationName = 'query' | 'body' | 'params';
type LocationSchema<V extends typeof ExpressValidator> = Record<
  string,
  | ValidationFactoryNamesOf<V>
  | { name: ValidationFactoryNamesOf<V>; required?: boolean }
>;
type ValidationSchema<V extends typeof ExpressValidator> =
  | ValidationChainNamesOf<V>
  | Partial<Record<LocationName, LocationSchema<V>>>;
const validationChain = {
  query: query,
  params: param,
  body: body,
};

/**
 * Add express-validator middlewares to an Express controller
 * @param schema Validation schema to use for this request
 * @param validator BaseValidator derived instance
 * @returns Decorator to add validation middlewares to the Express controller
 */
export function Validator<V extends typeof ExpressValidator>(
  validator: V,
  schema: ValidationSchema<V>
): MethodDecorator {
  return (target, key, desc) => {
    const controller = getControllers(target, key, desc);
    const controllers: EController[] = [];

    if (typeof schema === 'string') {
      const chains = getValidationChain(validator, schema);
      if (chains instanceof Array) {
        controllers.push(...chains);
      } else {
        controllers.push(chains as unknown as ValidationChain);
      }
    } else {
      for (const locationName in schema) {
        const location = schema[locationName as LocationName];
        for (const field in location) {
          const factory = location[field as keyof typeof location];
          const name = typeof factory === 'string' ? factory : factory.name;
          const required =
            typeof factory === 'string' ? undefined : factory.required;
          const chainFactory = getValiadtionFactory(
            validator,
            name
          ) as unknown as ValidationChainFactory;
          const baseChain = validationChain[locationName as LocationName];
          const chain = chainFactory(baseChain(field));
          if (required === true) {
            chain.notEmpty();
          } else if (required === false) {
            chain.optional();
          }
          controllers.push(chain);
        }
      }
    }
    controllers.push(handleBadRequest);
    if (controller instanceof Array) {
      controllers.push(...controller);
    } else {
      controllers.push(controller);
    }
  };
}

export function RequireAuth(
  target: any,
  key: string,
  desc?: PropertyDescriptor
) {
  const controller = getControllers(target, key, desc);
  const controllers: EController[] = [
    AuthMiddleware.isAuthenticated,
    ...(controller instanceof Array ? controller : [controller]),
  ];
  desc?.value ? (desc.value = controllers) : (target[key] = controllers);
}

function handleBadRequest(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // validationErrors: errors.array()
    return next(new Error('Bad request')); // TODO proper error handling
  }
  next();
}
