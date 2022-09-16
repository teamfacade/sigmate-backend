/**
 * Check if all the environment variables and various required files are in place
 */

import * as fs from 'fs';

const envVarNames = [
  'NODE_ENV',
  'PORT',
  'DB_DATABASE',
  'DB_USERNAME',
  'DB_AWS_USERNAME',
  'DB_PASSWORD',
  'DB_AWS_PASSWORD',
  'DB_HOST',
  'DB_AWS_HOST',
  'DB_PORT',
  'AWS_ACCESS_KEY',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_BUCKET_NAME',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'PATH_PUBLIC_KEY',
  'PATH_PRIVATE_KEY',
];

const checkEnv = () => {
  const missingEnv = envVarNames.reduce((p, c) => {
    return p || !process.env[c];
  }, false);

  if (missingEnv) {
    console.log('❌ Following Environment variables are not set.');
    envVarNames.forEach((v) => {
      if (!process.env[v]) {
        console.log(`- ${v}`);
      }
    });
    throw new Error('Environment variables not set.');
  }

  try {
    fs.readFileSync(process.env.PATH_PUBLIC_KEY);
    fs.readFileSync(process.env.PATH_PRIVATE_KEY);
  } catch (error) {
    throw new Error('❌ Server keys are missing.');
  }

  console.log(`✅ Enviroment set: ${process.env.NODE_ENV}`);
};

export default checkEnv;
