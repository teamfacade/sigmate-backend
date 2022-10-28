/**
 * Check if all the environment variables and various required files are in place
 */

import * as fs from 'fs';

const envVarNames = [
  'NODE_ENV',
  'SERVICE_NAME',
  'PORT',
  'DB_PORT',
  'DB_DATABASE_DEV',
  'DB_DATABASE_TEST',
  'DB_DATABASE_PROD',
  'DB_USERNAME_DEV',
  'DB_USERNAME_TEST',
  'DB_USERNAME_PROD',
  'DB_PASSWORD_DEV',
  'DB_PASSWORD_TEST',
  'DB_PASSWORD_PROD',
  'DB_HOST_DEV',
  'DB_HOST_TEST',
  'DB_HOST_PROD',
  'AWS_BUCKET_NAME',
  'AWS_ACCESS_KEY',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_S3_IMAGE_BASEURL',
  'COOKIE_SECRET',
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
