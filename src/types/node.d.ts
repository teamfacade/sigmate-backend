declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'test' | 'production'; // checked
    SERVICE_NAME: string;
    SERVER_TYPE: string;
    PORT: number; // checked
    DB_PORT: number; // checked
    DB_DATABASE_DEV: string; // checked
    DB_DATABASE_TEST: string; // checked
    DB_DATABASE_PROD: string; // checked
    DB_USERNAME_DEV: string; // checked
    DB_USERNAME_TEST: string; // checked
    DB_USERNAME_PROD: string; // checked
    DB_PASSWORD_DEV: string; // checked
    DB_PASSWORD_TEST: string; // checked
    DB_PASSWORD_PROD: string; // checked
    DB_HOST_DEV: string; // checked
    DB_HOST_TEST: string; // checked
    DB_HOST_PROD: string; // checked
    COOKIE_SECRET: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    PATH_PUBLIC_KEY: string;
    PATH_PRIVATE_KEY: string;
    AWS_BUCKET_NAME: string;
    AWS_ACCESS_KEY: string;
    AWS_SECRET_ACCESS_KEY: string;
    AWS_LOGGER_ACCESS_KEY: string;
    AWS_LOGGER_SECRET_ACCESS_KEY: string;
    AWS_S3_IMAGE_BASEURL: string;
  }
}
