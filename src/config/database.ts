import { SequelizeOptions } from 'sequelize-typescript';

interface DBConfig extends SequelizeOptions {
  username: string;
  password: string;
  database: string;
}

interface DBConfigs {
  [key: string]: DBConfig;
}

const databaseConfig: DBConfigs = {
  development: {
    username: process.env.DB_USERNAME_DEV,
    password: process.env.DB_PASSWORD_DEV,
    database: process.env.DB_DATABASE_DEV,
    host: process.env.DB_HOST_DEV,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    timezone: '+09:00',
    dialectOptions: {
      timezone: '+09:00',
    },
    benchmark: true,
  },
  test: {
    username: process.env.DB_USERNAME_TEST,
    password: process.env.DB_PASSWORD_TEST,
    database: process.env.DB_DATABASE_TEST,
    host: process.env.DB_HOST_TEST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    timezone: '+09:00',
    dialectOptions: {
      timezone: '+09:00',
    },
    benchmark: true,
  },
  production: {
    username: process.env.DB_USERNAME_PROD,
    password: process.env.DB_PASSWORD_PROD,
    database: process.env.DB_DATABASE_PROD,
    host: process.env.DB_HOST_PROD,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    timezone: '+09:00',
    dialectOptions: {
      timezone: '+09:00',
    },
    logging: false,
  },
};

export default databaseConfig;
