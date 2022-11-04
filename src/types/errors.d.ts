declare namespace sigmate.Errors {
  export interface ServerErrorOptions {
    /**
     * Name of the error (usually the class constructor name)
     * to identify the type of error that was thrown
     */
    name: string;
    /**
     * The error that caused this ServerErrror instance to be thrown
     */
    origin?: unknown;
    /**
     * Indicates whether this error was thrown from an unknown cuase.
     */
    unexpected?: boolean;
  }

  export interface RequestErrorOptions extends ServerErrorOptions {
    /**
     * Message describing the error
     */
    message?: string;
    /**
     * Message to be sent to the client in a HTTP response.
     * Overrides the message property, in case the message contains details that
     * need to be obscured from the client. If not set, the contents of the
     * `message` property will be included in the response.
     */
    clientMessage?: string;
    /**
     * A RequestService instance for the request where the error was generated
     */
    service?: sigmate.Services.RequestService;
  }

  export interface ActionErrorOptions extends Omit<ServerErrorOptions, 'name'> {
    /**
     * Message describing the error
     */
    message?: string;
  }

  export interface SequelizeErrorOptions
    extends Omit<ServerErrorOptions, 'origin'> {
    name?: string;
    /**
     * Message describing the error
     */
    message?: string;
  }

  type ExpressValidationError =
    | {
        param: '_error';
        msg: any;
        nestedErrors: ValidationError[];
        location?: undefined;
        value?: undefined;
      }
    | {
        location: Location;
        param: string;
        value: any;
        msg: any;
        nestedErrors?: unknown[];
      };

  type ValidationError = (Partial<ExpressValidationError> & { data?: any })[];

  export interface BadRequestErrorOptions extends RequestErrorOptions {
    validationErrors?: ValidationError[];
  }
}
