const dbConfig = {
  development: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  },
  production: {
    host: process.env.DB_AWS_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_AWS_USERNAME,
    password: process.env.DB_AWS_PASSWORD,
    database: process.env.DB_DATABASE,
  },
};

export default dbConfig;
