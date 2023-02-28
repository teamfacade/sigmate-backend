import { createClient, ReconnectStrategyError } from 'redis';
import ServiceError from './errors/ServiceError';
import SingletonService from './SingletonService';

type RedisClient = ReturnType<typeof createClient>;

export default class RedisService extends SingletonService {
  public static instance: RedisService;

  private client: RedisClient;
  constructor() {
    super({ name: 'Redis' });

    const HOST = process.env.REDIS_HOST || '127.0.0.1';
    const PORT = process.env.REDIS_PORT || 6379;
    const USER = process.env.REDIS_ACL_USERNAME || 'default';
    const PASS = process.env.REDIS_ACL_PASSWORD || 'redispw';

    const client = createClient({
      url: `redis://${USER}:${PASS}@${HOST}:${PORT}`,
      socket: {
        reconnectStrategy: this.reconnectStrategy,
      },
    });

    // The client is initiating a connection to the server.
    // client.on('connect', this.onConnect.bind(this));
    // The client successfully initiated the connection to the server.
    client.on('ready', this.onReady.bind(this));
    // The client disconnected the connection to the server via .quit() or .disconnect().
    client.on('end', this.onEnd.bind(this));
    // When a network error has occurred, such as unable to connect to the server or the connection closed unexpectedly.
    client.on('error', this.onError.bind(this));
    // The client is trying to reconnect to the server.
    client.on('reconnecting', this.onReconnecting.bind(this));

    this.client = client;
  }

  public async run<T>(worker: (client: RedisClient) => Promise<T>) {
    if (this.isAvailable()) {
      return await worker(this.client);
    } else {
      throw new ServiceError({
        code: this.failed() ? 'SERVICE/UA_FAILED' : 'SERVICE/UA',
        message: 'Redis client is unavailable',
      });
    }
  }

  public async start() {
    this.setStatus('STARTING');
    try {
      await this.client.connect();
      await this.test();
    } catch (error) {
      if (error instanceof ReconnectStrategyError) {
        this.setStatus('FAILED', error);
      } else {
        this.setStatus('UNAVAILABLE', error);
      }
      throw error;
    }
  }

  public async test() {
    try {
      await this.client.ping();
      this.setStatus('AVAILABLE');
    } catch (error) {
      this.setStatus('UNAVAILABLE', error);
      throw error;
    }
  }

  public async close() {
    this.setStatus('CLOSING');
    await this.client.quit(); // graceful shutdown (instead of .disconnect())
  }

  private reconnectStrategy(retries: number): number | Error {
    if (!this.closed() && retries + 1 < Number.MAX_SAFE_INTEGER) {
      return Math.min(retries * 1000, 60 * 1000); // delay (max. 1 min)
    }
    return new Error('Retried too many times'); // thrown to caller
  }

  private onReady() {
    this.setStatus('AVAILABLE');
  }

  private onEnd() {
    this.setStatus('CLOSED');
  }

  private onError(error: unknown) {
    if (error instanceof Error) {
      // Wrong credentials(username-password) or disabled user
      if (error.message.includes('WRONGPASS')) {
        this.setStatus('FAILED', error); // Stop retrying connection
      }
    } else {
      if (!this.client.isReady) {
        this.setStatus(this.client.isOpen ? 'UNAVAILABLE' : 'FAILED', error);
      }
    }
  }

  private onReconnecting() {
    // If we are 're'connecting, connection has been lost.
    // Therefore, service is unavailable
    this.setStatus('UNAVAILABLE');
  }
}

export const redis = new RedisService();
