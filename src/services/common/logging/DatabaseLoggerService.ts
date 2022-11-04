import LoggerService from './LoggerService';
export default class DatabaseLoggerService extends LoggerService {
  static BENCHMARK_LOG_THRESHOLD = 1000;

  constructor() {
    super();
  }

  /**
   * Logging function to provide as Sequelize config
   * @param query SQL query generated by Sequelize
   * @param duration SQL query execution time in milliseconds.
   *  Only present when benchmarking option is enabled
   */
  sequelizeLogger(query: string, duration: number | undefined = undefined) {
    let message = `${query}`;
    let level: sigmate.Logger.LogLevel = 'silly';

    // Handle benchmark data
    if (typeof duration === 'number' && !isNaN(duration)) {
      message = `(${duration / 1000}s) ` + message;
      if (duration > DatabaseLoggerService.BENCHMARK_LOG_THRESHOLD) {
        level = 'debug';
      }
    }

    this.log({
      level,
      message,
      action: {
        id: '-',
        name: 'QUERY',
        type: 'DATABASE',
      },
    });
  }
}
