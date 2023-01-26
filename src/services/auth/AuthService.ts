import SingletonService from '../SingletonService';

export default class AuthService extends SingletonService {
  public static instance: AuthService;

  constructor({ name }: { name?: string }) {
    super({ name: name || 'Auth' });
  }
}

export const auth = new AuthService({ name: 'Auth' });
