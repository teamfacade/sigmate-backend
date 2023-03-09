import { UserAttribs } from '../models/User.model';

declare global {
  namespace sigmate.Api {
    namespace Auth {
      type AuthResponse = {
        user: User.UserResponse;
        accessToken?: string;
        refreshToken?: string;
      };
      interface Google extends sigmate.ReqTypes {
        body: { code: string };
        response: AuthResponse;
      }
    }

    namespace User {
      type UserResponse = Pick<
        UserAttribs,
        | 'id'
        | 'userName'
        | 'userNameUpdatedAt'
        | 'fullName'
        | 'fullNameUpdatedAt'
        | 'email'
        | 'emailUpdatedAt'
        | 'isEmailVerified'
        | 'profileImageUrl'
        | 'googleAccount'
        | 'googleAccountId'
        | 'googleUpdatedAt'
        | 'isGooglePublic'
        | 'twitterHandle'
        | 'twitterUpdatedAt'
        | 'isTwitterPublic'
        | 'discordAccount'
        | 'discordUpdatedAt'
        | 'isDiscordPublic'
        | 'metamaskWallet'
        | 'metamaskUpdatedAt'
        | 'isMetamaskPublic'
        | 'locale'
        | 'referralCode'
        | 'agreeTos'
        | 'agreeLegal'
        | 'agreePrivacy'
        | 'createdAt'
      >;
    }
  }
}
