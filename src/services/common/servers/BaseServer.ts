import { v4 as uuidv4 } from 'uuid';

/**
 * Abstract class for all Sigmate server classes to inherit from
 */
export default abstract class BaseServer {
  /**
   * Server ID. Used to identify instances in logs when running in cluster
   */
  id: string;

  constructor() {
    this.id = uuidv4();
  }

  public abstract start(): void;
  public abstract close(): Promise<unknown>;

  protected abstract onStartSuccess(): void;
}
