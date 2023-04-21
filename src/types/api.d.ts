import { UserAttribs } from '../models/User.model';
import { BlockVerificationAttribs } from '../models/wiki/test/BlockVerification.model';
import { BlockVersionId } from '../models/wiki/BlockVersion.model';

declare global {
  namespace sigmate.Api {
    namespace Auth {
      type AuthResponse = {
        user: User.UserResponse;
        accessToken?: string;
        refreshToken?: string;
      };

      interface RenewAccess extends sigmate.ReqTypes {
        body: {
          refreshToken: string;
        };
        response: Omit<AuthResponse, 'user'>;
      }

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

      interface GetMetamaskNonce extends sigmate.ReqTypes {
        query: { metamaskWallet: string };
        response: { metamaskWallet: string; nonce: string };
      }

      interface AuthMetamask extends sigmate.ReqTypes {
        body: { metamaskWallet: string; signature: string };
        response: AuthResponse;
      }

      interface ConnectMetamaskVerify extends sigmate.ReqTypes {
        body: { metamaskWallet: string; signature: string };
      }

      interface Discord extends sigmate.ReqTypes {
        body: { code: string };
        response: AuthResponse;
      }

      interface ConnectDiscord extends sigmate.ReqTypes {
        body: {
          code: string;
        };
        response: { user: User.UserResponse };
      }

      interface DisconnectDiscord extends sigmate.ReqTypes {
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
        | 'discordAccountId',
        | 'discordUpdatedAt'
        | 'isDiscordPublic'
        | 'metamaskWallet'
        | 'metamaskUpdatedAt'
        | 'isMetamaskPublic'
        | 'isMetamaskVerified'
        | 'locale'
        | 'referralCode'
        | 'agreeTos'
        | 'agreeLegal'
        | 'agreePrivacy'
        | 'createdAt'
      > & { referredBy?: UserResponse };

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
          >
        > & {
          referredBy?: UserAttribs['referralCode'];
          agreeTos?: boolean;
          agreeLegal?: boolean;
          agreePrivacy?: boolean;
        };
        response: { user: UserResponse };
      }

      interface Check extends sigmate.ReqTypes {
        query: Partial<{
          userName: string;
          referralCode: string;
        }>;
        response: {
          success: boolean;
          userName?: {
            userName: string;
            isAvailable: boolean;
          };
          referralCode?: {
            referralCode: string;
            isValid: boolean;
          };
        };
      }
    }

    namespace Wiki {
      type BlockVerificationRequest = {
        id?: BlockVerificationAttribs['id']; // Create: No id
        type: BlockVerificationAttribs['type'];
        comment?: BlockVerificationAttribs['comment'];
        blockVersion: BlockVersionId;
      };

      type BlockVerificationResponse = {
        id: BlockVerificationAttribs['id'];
        type: BlockVerificationAttribs['type'];
        comment?: BlockVerificationAttribs['comment'];
        blockVersion: BlockVersionId;
        createdBy: User.UserResponse;
        createdAt: BlockVerificationAttribs['createdAt'];
        updatedAt: BlockVerificationAttribs['updatedAt'];
        deletedBy?: User.UserResponse;
        deletedAt?: BlockVerificationAttribs['deletedAt'];
      };
    }
  }
}
