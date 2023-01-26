declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'test' | 'production';
    SERVICE_NAME: string;
    PORT: number;
    DB_PORT: number;
    DB_DATABASE: string;
    DB_USERNAME: string;
    DB_PASSWORD: string;
    DB_HOST: string;
    AWS_BUCKET_NAME: string;
    AWS_ACCESS_KEY: string;
    AWS_SECRET_ACCESS_KEY: string;
    AWS_LOGGER_ACCESS_KEY: string;
    AWS_LOGGER_SECRET_ACCESS_KEY: string;
    AWS_S3_IMAGE_BASEURL: string;
    COOKIE_SECRET: string;
    DEVICE_SECRET: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    PATH_PUBLIC_KEY: string;
    PATH_PRIVATE_KEY: string;
    TWITTER_BEARER_TOKEN: string;
    LAMBDA_BOT_URL: string;
    REDIS_HOST: string;
    REDIS_PORT: number;
    REDIS_ACL_USERNAME: string;
    REDIS_ACL_PASSWORD: string;
  }
}
