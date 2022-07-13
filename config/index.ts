export interface EnvConfig<T> {
  production: T;
  development: T;
}

export const getNodeEnv = () => {
  return process.env.NODE_ENV === 'development' ? 'development' : 'production';
};
