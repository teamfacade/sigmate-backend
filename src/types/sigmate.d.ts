declare namespace sigmate {
  namespace Util {
    export type Optional<T, K> = Omit<T, K> & Partial<Pick<T, K>>;
  }

  namespace Auth {
    export interface JwtPayload {
      tok?: string;
      group?: string;
      isAdmin?: boolean;
    }
  }

  namespace User {}
}
