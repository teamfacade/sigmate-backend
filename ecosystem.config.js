module.exports = {
  apps: [
    {
      name: 'sigmate-app',
      script: 'npm run start',
      instances: 4,
      exec_mode: 'cluster',
      ignore_watch: ['node_modules'],
      env_production: {
        NODE_ENV: 'production',
      },
      env_development: {
        NODE_ENV: 'development',
      },
      env_test: {
        NODE_ENV: 'test',
      },
      log_file: 'sigmate-app-combined.log',
      combine_logs: true,
      min_uptime: 1000,
      listen_timeout: 10000,
      kill_timeout: 10500,
      wait_ready: true,
      max_restarts: 10,
      restart_delay: 500,
    },
  ],
};
