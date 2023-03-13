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

      interface ConnectGoogle extends sigmate.ReqTypes {
        body: {
          code: string;
        };
        response: { user: User.UserResponse };
      }

      interface DisconnectGoogle extends sigmate.ReqTypes {
        body: {
          code: string;
        };
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

      interface GetMyInfo extends sigmate.ReqTypes {
        query: { all?: string };
        response: { user: sigmate.Api.User.UserResponse };
      }

      interface UpdateMyInfo extends sigmate.ReqTypes {
        body: Partial<
          Pick<
            UserAttribs,
            | 'userName'
            | 'fullName'
            | 'bio'
            | 'email'
            | 'isGooglePublic'
            | 'isTwitterPublic'
            | 'isDiscordPublic'
            | 'isMetamaskPublic'
            | 'locale'
            | 'agreeTos'
            | 'agreeLegal'
            | 'agreePrivacy'
          >
        >;
        response: { user: UserResponse };
      }
    }
  }
}
