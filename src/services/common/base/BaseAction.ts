import { v4 as uuidv4 } from 'uuid';
type ActionType = symbol;
type ActionWorker<P extends any[], R> = (
  action: BaseAction<P, R>,
  ...params: P
) => R | Promise<R>;
interface ActionOptions {
  type: ActionType;
  autoStart?: boolean;
  parent?: BaseAction<any, any>;
  throws?: boolean;
}

export default abstract class BaseAction<P extends any[], R> {
  // Action Type
  static TYPE_SERVICE = Symbol('service');
  static TYPE_DATABASE = Symbol('database');

  // Action status
  static IDLE = Symbol('idle');
  static STARTED = Symbol('started');
  static IN_PROGRESS = Symbol('in progress');
  static DELAYED = Symbol('delayed');
  static FINISHED = Symbol('finished');
  static ERROR = Symbol('error');

  /** Unique identifier generated using uuid (v4) */
  id: string;
  /** Whether this is a service or database level action */
  type: ActionType;
  /** Name of the action (needed for auth checks) */
  name: string;
  /** An AuthService instance to run the auth checks */
  auth: unknown;
  /**
   * Current status of the action. Use one of provided static variable:
   * IDLE, STARTED, IN_PROGRESS, DELAYED, FINISHED or ERROR
   */
  status: symbol = BaseAction.IDLE;
  /** Function containing the code to actually run the action */
  worker: ActionWorker<P, R>;
  /**
   * Start action immdediately after the action instance is initialized
   */
  autoStart: boolean;
  /**
   * Reference to parent action (who called this action)
   */
  parent?: BaseAction<any, any>;
  /** Data returned from action worker */
  data?: R;
  /** Error thrown from action worker */
  error?: Error;
  /** Throw the action error when the worker throws it */
  throws?: boolean;
  /** Log level. use NPM-style log levels (logging) */
  logLevel = 'verbose';
  /** Logger instance (logging) */
  logger: unknown;
  /**
   * Record when the action was started (for logging).
   * Undefined if the action has not yet started
   */
  startedAt?: Date;
  /**
   * Record when the action was stopped (for any reaason)
   * Undefined if the action has not yet started, or is still running
   */
  stoppedAt?: Date;

  constructor(
    name: string,
    worker: ActionWorker<P, R>,
    options: ActionOptions
  ) {
    this.id = uuidv4();
    this.name = name;
    this.worker = worker;

    const { type, parent, autoStart = false, throws = true } = options;
    this.type = type;
    this.parent = parent;
    this.autoStart = autoStart;
    this.throws = throws;
  }

  init() {
    this.startedAt = undefined;
    this.stoppedAt = undefined;
    this.data = undefined;
    this.error = undefined;
  }
}
