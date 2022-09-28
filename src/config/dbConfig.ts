const dbConfig = {
  development: {
    host: process.env.DB_HOST_DEV,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME_DEV,
    password: process.env.DB_PASSWORD_DEV,
    database: process.env.DB_DATABASE_DEV,
  },
  test: {
    host: process.env.DB_HOST_TEST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME_TEST,
    password: process.env.DB_PASSWORD_TEST,
    database: process.env.DB_DATABASE_TEST,
  },
  production: {
    host: process.env.DB_HOST_PROD,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME_PROD,
    password: process.env.DB_PASSWORD_PROD,
    database: process.env.DB_DATABASE_PROD,
  },
};

export default dbConfig;
