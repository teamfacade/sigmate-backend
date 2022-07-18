/**
 * Check if all the environment variables and various required files are in place
 */

import * as fs from 'fs';

const checkEnv = () => {
  const missingEnv =
    !process.env.NODE_ENV ||
    !process.env.PORT ||
    !process.env.DB_DATABASE ||
    !process.env.DB_USERNAME ||
    !process.env.DB_PASSWORD ||
    !process.env.DB_HOST ||
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_CLIENT_SECRET ||
    !process.env.PATH_PUBLIC_KEY ||
    !process.env.PATH_PRIVATE_KEY;

  if (missingEnv) {
    console.log('❌ Following Environment variables are not set.');
    !process.env.NODE_ENV && console.log('NODE_ENV');
    !process.env.PORT && console.log('PORT');
    !process.env.DB_DATABASE && console.log('DB_DATABASE');
    !process.env.DB_USERNAME && console.log('DB_USERNAME');
    !process.env.DB_PASSWORD && console.log('DB_PASSWORD');
    !process.env.DB_HOST && console.log('DB_HOST');
    !process.env.GOOGLE_CLIENT_ID && console.log('GOOGLE_CLIENT_ID');
    !process.env.GOOGLE_CLIENT_SECRET && console.log('GOOGLE_CLIENT_SECRET');
    !process.env.PATH_PUBLIC_KEY && console.log('PATH_PUBLIC_KEY');
    !process.env.PATH_PRIVATE_KEY && console.log('PATH_PRIVATE_KEY');
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
