import dbConfig from './dbConfig';
import mysql from 'mysql2';

const config = dbConfig[process.env.NODE_ENV];
const pool = mysql.createPool(config);
const promisePool = pool.promise();

export default promisePool;
