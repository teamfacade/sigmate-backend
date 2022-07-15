import { SequelizeOptions } from 'sequelize-typescript';
import { EnvConfig } from '.';
import RequireProperty from '../utilities/RequireProperty';

type RequiredOptions =
  | 'database'
  | 'username'
  | 'password'
  | 'host'
  | 'dialect'
  | 'timezone'
  | 'dialectOptions';

type DbOptions = RequireProperty<SequelizeOptions, RequiredOptions>;

const dbConfig: EnvConfig<DbOptions> = {
  development: {
    database: process.env.DB_DATABASE as string,
    username: process.env.DB_USERNAME as string,
    password: process.env.DB_PASSWORD as string,
    host: process.env.DB_HOST as string,
    dialect: 'mysql',
    timezone: '+09:00',
    dialectOptions: {
      timezone: '+09:00',
    },
  },
  production: {
    database: process.env.DB_DATABASE as string,
    username: process.env.DB_USERNAME as string,
    password: process.env.DB_PASSWORD as string,
    host: process.env.DB_HOST as string,
    dialect: 'mysql',
    timezone: '+09:00',
    dialectOptions: {
      timezone: '+09:00',
    },
  },
};

export default dbConfig;
