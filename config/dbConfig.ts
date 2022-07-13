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
    database: process.env.DB_DATABASE || 'sigmate_dev',
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'MySQL2022!@',
    host: 'localhost',
    dialect: 'mysql',
    timezone: '+09:00',
    dialectOptions: {
      timezone: '+09:00',
    },
  },
  production: {
    database: process.env.DB_DATABASE || 'sigmate_dev',
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'MySQL2022!@',
    host: 'localhost',
    dialect: 'mysql',
    timezone: '+09:00',
    dialectOptions: {
      timezone: '+09:00',
    },
  },
};

export default dbConfig;
