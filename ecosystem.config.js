module.exports = {
  apps: [
    {
      name: 'sigmate-app',
      // For cluster mode,
      script: 'dist/index.js',
      args: 'app',
      instances: 4,
      exec_mode: 'cluster',
      ignore_watch: ['node_modules'],
      env_production: {
        NODE_ENV: 'production',
        PORT: 80,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 5100,
      },
      env_test: {
        NODE_ENV: 'test',
        PORT: 80,
      },
      min_uptime: 1000,
      listen_timeout: 10000,
      kill_timeout: 15000,
      wait_ready: true,
      max_restarts: 10,
      restart_delay: 500,
    },
  ],
};
