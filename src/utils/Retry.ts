import { wait } from '.';

type ErrorCallbackArgs = {
  error: unknown;
  retries: number;
  maxRetries: number;
};

type ErrorCallback =
  | ((args: ErrorCallbackArgs) => void)
  | ((args: ErrorCallbackArgs) => Promise<void>);

type RetryOptions = {
  maxRetries: number;
  initDelay: number;
  incrementDelay: 'exponential' | number;
  errorCallback: ErrorCallback;
};

export default class Retry {
  maxRetries: number;
  initDelay: number;
  incrementDelay: (d: number) => number;
  errorCallback: ErrorCallback;

  retries!: number;
  delay!: number;

  attempt?: Promise<unknown> = undefined;

  constructor(options: RetryOptions) {
    const { initDelay, incrementDelay, maxRetries, errorCallback } = options;

    this.initDelay = initDelay;
    this.maxRetries = maxRetries;
    this.errorCallback = errorCallback;

    if (typeof incrementDelay === 'number') {
      this.incrementDelay = (d: number) => d + incrementDelay;
    } else {
      switch (incrementDelay) {
        case 'exponential':
        default:
          this.incrementDelay = (d: number) => d * 2;
          break;
      }
    }
    this.reset();
  }

  reset() {
    this.retries = 0;
    this.delay = this.initDelay;
  }

  private async __run(promise: Promise<void>) {
    while (this.retries <= this.maxRetries) {
      this.retries += 1;
      try {
        return await promise;
      } catch (error) {
        const errCb = this.errorCallback({
          error,
          retries: this.retries,
          maxRetries: this.maxRetries,
        });
        await wait(this.delay);
        if (errCb instanceof Promise) {
          await errCb;
        }
        this.delay = this.incrementDelay(this.delay);
      }
    }
  }

  async run(promise: Promise<void>) {
    if (!this.attempt) {
      this.reset();
      this.attempt = this.__run(promise);
    }

    await this.attempt;
    this.attempt = undefined;
  }
}
