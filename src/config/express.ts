const expressConfig = {
  development: {
    staticFilesRoot: 'public',
    corsOrigin: 'http://localhost:3000',
  },
  test: {
    staticFilesRoot: 'public',
    corsOrigin: 'http://localhost:3000',
  },
  production: {
    staticFilesRoot: 'public',
    corsOrigin: 'http://localhost:3000',
  },
};

export default expressConfig;
