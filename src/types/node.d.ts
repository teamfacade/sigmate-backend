declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'test' | 'production';
    PORT: number;
    DEBUG_LOG_LEVEL?: string;
    FILE_STORAGE?: string;
    DB_PORT: number;
    DB_DATABASE: string;
    DB_USERNAME: string;
    DB_PASSWORD: string;
    DB_HOST: string;
    AWS_ACCESS_KEY: string;
    AWS_SECRET_ACCESS_KEY: string;
    AWS_REGION: string;
    AWS_BUCKET_NAME: string;
    AWS_DYNAMODB_ENDPOINT: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    DISCORD_CLIENT_ID: string;
    DISCORD_CLIENT_SECRET: string;
    TWITTER_BEARER_TOKEN: string;
    LAMBDA_BOT_URL: string;
  }
}
