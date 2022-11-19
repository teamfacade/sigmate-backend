declare namespace sigmate {
  namespace Util {
    export type Optional<T, K> = Omit<T, K> & Partial<Pick<T, K>>;
  }

  namespace Auth {
    export interface JwtPayload {
      type?: string;
      group?: number;
      isAdmin?: boolean;
      iat?: number;
    }

    export type TokenType = 'a' | 'r';

    export type GoogleProfile = {
      id: string;
      displayName: string;
      email: string;
      coverPhoto: string;
      photo: string;
      locale: string;
    };

    export type AuthMethod = 'jwt' | 'google' | 'metamask';
    export type AuthDTO = {
      jwt?: {
        accessToken?: string;
        refreshToken?: string;
      };
      google?: {
        code: string;
      };
      metamask?: {
        metamaskWallet: string;
        signature?: string;
      };
    };
  }
}
