declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'test' | 'production';
    SERVICE_NAME: string;
    PORT: number;
    DB_PORT: number;
    DB_DATABASE_DEV: string;
    DB_DATABASE_TEST: string;
    DB_DATABASE_PROD: string;
    DB_USERNAME_DEV: string;
    DB_USERNAME_TEST: string;
    DB_USERNAME_PROD: string;
    DB_PASSWORD_DEV: string;
    DB_PASSWORD_TEST: string;
    DB_PASSWORD_PROD: string;
    DB_HOST_DEV: string;
    DB_HOST_TEST: string;
    DB_HOST_PROD: string;
    AWS_BUCKET_NAME: string;
    AWS_ACCESS_KEY: string;
    AWS_SECRET_ACCESS_KEY: string;
    AWS_S3_IMAGE_BASEURL: string;
    COOKIE_SECRET: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    PATH_PUBLIC_KEY: string;
    PATH_PRIVATE_KEY: string;
    AWS_ACCESS_KEY: string;
    AWS_SECRET_ACCESS_KEY: string;
    AWS_BUCKET_NAME: string;
  }
}
