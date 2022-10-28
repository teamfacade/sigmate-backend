import db from '../../models';
import DatabaseEngine from './database';
import WikiEngine from './wiki';

export const databaseEngine = new DatabaseEngine(
  process.env.NODE_ENV,
  db.sequelize
);

export const wikiEngine = new WikiEngine(databaseEngine);
