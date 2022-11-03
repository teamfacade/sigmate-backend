declare namespace sigmate.Services {
  export declare class RequestService {
    /**
     * Unique ID for this client's request.
     * Use uuid v4.
     */
    id: string;

    /**
     * Current status of this request
     */
    status: sigmate.Logger.RequestStatus = 'UNDEFINED';

    /**
     * Express Request object
     */
    req: Request;

    /**
     * When the request was received
     */
    startedAt?: number;
    /**
     * When a response for this request was sent
     */
    endedAt?: number;

    response: NonNullable<sigmate.Logger.LogInfo['request']>['response'];

    constructor(req: Express.Request);
    start(): void;
    finish(res: Express.Response, payload: any, size = -1): void;
    get method(): string;
    get endpoint(): string;
    get query(): qs.ParsedQs;
    get params(): Record<string, any>;
    get body(): Record<string, any>;
    get size(): number;
  }
}
