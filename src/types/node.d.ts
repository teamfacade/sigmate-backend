declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'test' | 'production';
    PORT: number;
    DB_DATABASE: string;
    DB_USERNAME: string;
    DB_PASSWORD: string;
    DB_DEV_PASSWORD: string;
    DB_AWS_PASSWORD: string;
    DB_HOST: string;
    DB_DEV_HOST: string;
    DB_AWS_HOST: string;
    DB_PORT: number;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    PATH_PUBLIC_KEY: string;
    PATH_PRIVATE_KEY: string;
    AWS_ACCESS_KEY: string;
    AWS_SECRET_ACCESS_KEY: string;
    AWS_BUCKET_NAME: string;
  }
}
