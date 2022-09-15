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
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    timezone: '+09:00',
    dialectOptions: {
      timezone: '+09:00',
    },
  },
  test: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    timezone: '+09:00',
    dialectOptions: {
      timezone: '+09:00',
    },
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    timezone: '+09:00',
    dialectOptions: {
      timezone: '+09:00',
    },
  },
};

export default databaseConfig;
