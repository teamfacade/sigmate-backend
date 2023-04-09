import { auth } from 'twitter-api-sdk';
import { TwitterApi } from 'twitter-api-v2';
import { OAuth2User } from 'twitter-api-sdk/dist/OAuth2User';
import AuthService, { AuthenticateDTO } from '.';
import TwitterAuthError from '../../errors/auth/twitter';
import { ActionArgs, ActionMethod } from '../../utils/action';
import { User, UserAttribs } from '../../models/User.model';
import { account } from '../account';

interface GetTokenResponse {
  /** Allows an application to obtain a new access token without prompting the user via the refresh token flow. */
  refresh_token?: string;
  /** Access tokens are the token that applications use to make API requests on behalf of a user.  */
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  /** Comma-separated list of scopes for the token  */
  scope?: string;
}
interface Token extends Omit<GetTokenResponse, 'expires_in'> {
  /** Date that the access_token will expire at.  */
  expires_at?: number;
}

export type ParsedTwitterProfile = {
  handle: string;
  photo?: string;
  location?: string;
};

export default class TwitterAuthService extends AuthService {
  private REDIRECT_URI = Object.freeze({
    development: 'http://localhost:3000/auth',
    test: 'https://beta.sigmate.io/auth',
    production: 'https://sigmate.io/auth',
  });

  private __client?: OAuth2User;
  private get client() {
    if (!this.__client)
      throw new Error('TwitterAuthService: Client not initialized');
    return this.__client;
  }

  private __authorizationUrl?: string;
  public get authorizationUrl() {
    if (!this.__authorizationUrl)
      throw new Error('TwitterAuthService: AuthorizationUrl not set');
    return this.__authorizationUrl;
  }

  public async start(): Promise<void> {
    this.setStatus('STARTING');

    //Actually, after once bearer_token gotten, we can change it as auth.OAuth2Bearer.
    const client = new auth.OAuth2User({
      client_id: process.env.TWITTER_CLIENT_ID as string,
      client_secret: process.env.TWITTER_CLIENT_SECRET as string,
      callback: this.REDIRECT_URI[this.env],
      scopes: ['tweet.read', 'users.read', 'offline.access'],
    });

    this.__authorizationUrl = client.generateAuthURL({
      state: 'sigmate-secret-state',
      code_challenge_method: 's256',
    });

    this.__client = client;

    this.setStatus('AVAILABLE');
  }

  async close() {
    this.setStatus('CLOSED');
  }

  @ActionMethod({
    name: 'AUTH/TWITTER_AUTH',
    type: 'COMPLEX',
  })
  public async authenticate(args: AuthenticateDTO & ActionArgs) {
    const { twitter, req, action } = args;
    if (!twitter) throw new Error('TwitterAuthService: Code not provided');
    const { code } = twitter;

    const tokens = await this.getTwitterTokens({
      code,
      parentAction: action,
    });
    const profile = await this.getTwitterProfile({
      tokens,
      parentAction: action,
    });

    const twitterHandle = profile.handle;
    let user: User | null = await this.findUser({
      twitterHandle,
      parentAction: action,
    });
    if (!user) {
      user = await account.create({
        twitter: {
          twitterHandle: profile.handle,
          profileImageUrl: profile.photo,
          locale: profile.location,
          twitterRefreshToken: tokens.refresh_token || undefined,
        },
        parentAction: action,
      });
    }
    if (req) req.user = user || undefined;
    return user;
  }

  @ActionMethod({
    name: 'AUTH/TWITTER_TOKENS',
    type: 'HTTP',
  })
  private async getTwitterTokens(args: { code?: string } & ActionArgs) {
    const { code } = args;
    if (!code) throw new TwitterAuthError('AUTH/TWITTER/NF_CODE');
    try {
      const { token: tokens } = await this.client.requestAccessToken(code);
      return tokens;
    } catch (error) {
      throw new TwitterAuthError({ code: 'AUTH/Twitter/UA_TOKEN', error });
    }
  }

  private async getTwitterProfile(args: { tokens: Token } & ActionArgs) {
    const { tokens } = args;
    if (!tokens?.access_token) {
      throw new TwitterAuthError('AUTH/TWITTER/NF_ACCESS_TOKEN');
    }
    const userApi = new TwitterApi(tokens.access_token);

    const { data } = await userApi.currentUserV2().catch((error) => {
      throw new TwitterAuthError({ code: 'AUTH/Twitter/UA_PROFILE', error });
    });

    const profile: ParsedTwitterProfile = {
      handle: data.username,
      photo: data.profile_image_url,
      location: data.location || undefined,
    };

    return profile;
  }

  @ActionMethod('AUTH/TWITTER_FIND_USER')
  private async findUser(
    args: { twitterHandle: UserAttribs['twitterHandle'] } & ActionArgs
  ) {
    const { twitterHandle, transaction } = args;
    return await User.findOne({
      where: { twitterHandle },
      transaction,
      ...User.FIND_OPTS.auth,
    });
  }
}

export const twitterAuth = new TwitterAuthService();
