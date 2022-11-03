module.exports = {
  apps: [
    {
      name: 'sigmate-app',
      // For cluster mode,
      script: 'dist/index.js',
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
      min_uptime: 1000,
      listen_timeout: 10000,
      kill_timeout: 10500,
      wait_ready: true,
      max_restarts: 10,
      restart_delay: 500,
    },
  ],
};
