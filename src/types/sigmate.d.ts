import { ParsedQs } from 'qs';
import { RequestHandler } from 'express';
import { ValidationError } from 'express-validator';

declare global {
  namespace sigmate {
    type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

    type TaskStatus = 'STARTED' | 'SUCCESS' | 'FAILED';
    type ServiceStatus =
      | 'INITIALIZED'
      | 'STARTING'
      | 'AVAILABLE'
      | 'UNAVAILABLE'
      | 'CLOSING'
      | 'CLOSED';
    type AnyStatus = TaskStatus | ServiceStatus;

    /** Pagination data in request object */
    type ReqPg = {
      limit: number;
      offset: number;
      page?: number;
    };

    /** Request and Response typing defaults */
    type ReqDefaultTypes = {
      params: Record<string, string>;
      query: ParsedQs;
      body: Record<string, unknown>;
      response: Record<string, unknown>;
      pg: boolean;
    };

    type ReqTypes = Partial<ReqDefaultTypes>;

    /** Utility type for request and response typing */
    type ReqHandler<D extends Partial<ReqDefaultTypes> = ReqDefaultTypes> =
      RequestHandler<
        D['params'] extends ReqDefaultTypes['params']
          ? D['params']
          : ReqDefaultTypes['params'],
        D['response'] extends ReqDefaultTypes['response']
          ? D['response'] & { meta: ResMeta; success: boolean | number }
          : any,
        D['body'] extends ReqDefaultTypes['body'] ? D['body'] : any,
        D['query'] extends ReqDefaultTypes['query']
          ? D['pg'] extends true
            ? D['query'] & Partial<ReqPg>
            : D['query']
          : D['pg'] extends true
          ? ReqDefaultTypes['query'] & Partial<ReqPg>
          : ReqDefaultTypes['query']
      >;

    /** Pagination data to embed in response */
    type ResPg = {
      limit: number;
      offset: number;
      count: number;
      page: {
        current: number | null;
        total: number | null;
      };
    };

    type ResErr = {
      code: string;
      message: string;
      cause?: {
        code?: string;
        message: string;
      };
      validationErrors?: ValidationError[];
    };

    /** Metadata to embed in every response */
    type ResMeta = {
      id: string; // UUID
      requestedAt: string; // Date ISO-8601
      pg: ResPg | null;
      error: ResErr | null;
    };

    type ResMetaSize = {
      req: number;
      res?: number;
    };

    namespace Error {
      type Data<ErrorCode extends string = string> = {
        code: ErrorCode;
        message: string;
        name: string;
        logLevel: sigmate.Log.Level;
        httpCode: number;
        error: unknown;
        notify: boolean;
        critical: boolean;
        secure: boolean;
        validationErrors?: ValidationError[];
      };
      type RootData<ErrorCode extends string = string> = Data<ErrorCode> & {
        defaultsMap: DefaultsMap<ErrorCode>;
      };
      type Options<ErrorCode extends string = string> =
        | ErrorCode
        | Partial<Data<ErrorCode>>;
      type RootOptions<ErrorCode extends string = string> = Partial<
        RootData<ErrorCode>
      >;
      type Defaults = Partial<Omit<Data, 'code' | 'name' | 'cause'>>;
      type DefaultsMap<ErrorCode extends string = string> = Record<
        ErrorCode,
        Defaults
      >;
    }

    namespace Log {
      type Level =
        | 'error'
        | 'warn'
        | 'info'
        | 'http'
        | 'verbose'
        | 'debug'
        | 'silly';
      type SourceName = 'Server' | 'Service' | 'Request' | 'Action';

      // Events
      type ServerEvent =
        | 'SERVER/STATUS_CHANGE'
        | 'SERVER/MESSAGE'
        | 'SERVER/ERROR';
      type ServiceEvent =
        | 'SERVICE/STATUS_CHANGE'
        | 'SERVICE/MESSAGE'
        | 'SERVICE/ERROR';
      type RequestEvent =
        | 'REQ/START'
        | 'REQ/FINISH'
        | 'REQ/WARNING'
        | 'REQ/ERROR';
      type ActionEvent =
        | 'ACT/STATUS_CHANGE'
        | 'ACT/WARNING'
        | 'ACT/ERROR'
        | 'ACT/TX/START'
        | 'ACT/TX/COMMIT'
        | 'ACT/TX/ROLLBACK';
      type AuthEvent =
        | 'ACT/AUTH/WARNING'
        | 'ACT/AUTH/FAIL'
        | 'ACT/AUTH/BAN'
        | 'ACT/AUTH/UNBAN';
      type UserEvent = 'ACT/USER/FLAG' | 'ACT/USER/BAN' | 'ACT/USER/UNBAN';
      type MissionEvent =
        | 'ACT/MISSION/PROGRESS'
        | 'ACT/MISSION/COMPLETE'
        | 'ACT/MISSION/FAIL';
      type PointEvent = 'ACT/POINT/GIVE' | 'ACT/POINT/USE' | 'ACT/POINT/TAKE';
      type LevelEvent = 'ACT/LEVEL/CHANGE' | 'ACT/LEVEL/EXP';
      type AnyEvent =
        | ServerEvent
        | ServiceEvent
        | RequestEvent
        | ActionEvent
        | AuthEvent
        | UserEvent
        | MissionEvent
        | PointEvent
        | LevelEvent;

      type ActionTarget = {
        model: string;
        id: string | number;
        type?: 'sql' | 'dynamo';
        version?: string;
      };

      interface Info {
        level: Level;
        message: string;
        timestamp?: string;

        source?: SourceName;
        event?: AnyEvent;
        name?: string;
        /** HTTP status code for requests,  */
        status?: sigmate.AnyStatus | number;
        duration?: number;
        id?: string; // UUID
        size?: number | ResMetaSize;
        user?: {
          id: number | string;
          userName?: string;
        };
        device?: {
          ip?: string;
          ua?: string;
          os?: string;
          browser?: string;
          model?: string;
          type?: string;
        };
        error?: unknown;
        actionTarget?: ActionTarget[];
        /** Other data to leave in log. Will be stringified when logs are printed */
        misc?: Record<string, unknown>;
      }
    }
  }
}
