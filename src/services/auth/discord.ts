//import axios, { AxiosError } from 'axios';
//import qs from 'qs';
import AuthService, { AuthenticateDTO } from '.';
import { ActionArgs, ActionMethod } from '../../utils/action';
import { UserAttribs, User } from '../../models/User.model';
import { account } from '../account';
//import AccountError from '../../errors/account';
//import { DateTime, DurationLike } from 'luxon';
import OAuth from 'discord-oauth2';
import DiscordAuthError from '../../errors/auth/discord';
import AccountError from '../../errors/account';

export default class DiscordAuthService extends AuthService {
  private REDIRECT_URI = Object.freeze({
    development: 'http://localhost:3000/auth',
    test: 'https://beta.sigmate.io/auth',
    production: 'https://sigmate.io/auth',
  });

  private __client?: OAuth;
  private get client() {
    if (!this.__client) {
      throw new Error('DiscordAuthService: People API client not initialized');
    } else {
      return this.__client;
    }
  }

  private __authorizationUrl?: string;
  public get authorizationUrl() {
    if (!this.__authorizationUrl) {
      throw new Error('DiscordAuthService: AuthorizationUrl not set');
    } else {
      return this.__authorizationUrl;
    }
  }

  constructor() {
    super('DiscordAuth');
  }

  async start() {
    this.setStatus('STARTING');

    const client = new OAuth({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      redirectUri: this.REDIRECT_URI[this.env],
    });

    this.__authorizationUrl = client.generateAuthUrl({
      scope: ['identify', 'guild', 'email'],
      state: '123456', //암호화해서 디비에 저장해두는 용도
    });

    this.__client = client;

    this.setStatus('AVAILABLE');
  }

  async close() {
    this.setStatus('CLOSED');
  }

  @ActionMethod({
    name: 'AUTH/DISCORD_AUTH',
    type: 'COMPLEX',
  })
  public async authenticate(args: AuthenticateDTO & ActionArgs) {
    const { discord, req, action } = args;
    if (!discord) throw new Error('DiscordAuthService: Code not provided');
    const { code } = discord;
    //토큰 발급
    const tokens = await this.getDiscordTokens({ code, parentAction: action });
    const profile = await this.getDiscordProfile({
      tokens,
      parentAction: action,
    });
    // {
    // 	username: '1337 Krew',
    // 	locale: 'en-US',
    // 	mfa_enabled: true,
    // 	flags: 128,
    // 	avatar: '8342729096ea3675442027381ff50dfe',
    // 	discriminator: '4421',
    // 	id: '80351110224678912'

    // banner?: string | null | undefined;
    // accent_color?: string | null | undefined;
    // verified?: boolean;
    // email?: string | null | undefined;
    // premium_type?: number;
    // public_flags?: number;
    // }
    //토큰 발급 햇으니 유저 추가 혹은 연결 작업을 아래서

    if (!profile.email) {
      throw new Error(); // email이 없는 경우 에러
    }

    const discordAccountId = profile.id;
    let user: User | null = await this.findUser({
      discordAccountId,
      parentAction: action,
    });

    if (!user) {
      // If not, create an account
      user = await account.create({
        discord: {
          discordAccount: profile.email,
          discordAccountId: discordAccountId,
          locale: profile.locale,
          discordRefreshToken: tokens.refresh_token,
          // 추가로 avatar나 username을 넣을수 있을것 같습니다.
        },
        parentAction: action,
      });
    }

    if (req) req.user = user || undefined;
    return user;
  }

  //connect, disconnect
  @ActionMethod({ name: 'AUTH/DISCORD_CONNECT', type: 'COMPLEX' })
  public async connect(args: { code: string; user: User } & ActionArgs) {
    const { code, user, transaction, action } = args;
    const tokens = await this.getDiscordTokens({ code, parentAction: action });
    const profile = await this.getDiscordProfile({
      tokens,
      parentAction: action,
    });

    if (!profile.email) {
      throw new Error(); // email이 없는 경우 에러
      //OAuth.User의 email이 null일 수 있어서 넣어둔 부분...
    }

    const alreadyExists = await User.findOne({
      where: { discordAccountId: profile.id },
      transaction,
    });
    if (alreadyExists) {
      throw new AccountError('ACCOUNT/CF_CONNECT_DISCORD_ALREADY_EXISTS');
    }

    await account.connectDiscord({
      user,
      discord: {
        discordAccount: profile.email,
        discordAccountId: profile.id,
        discordRefreshToken: tokens.refresh_token || undefined,
      },
      parentAction: action,
    });

    return user;
  }

  @ActionMethod('AUTH/DISCORD_FIND_USER')
  private async findUser(
    args: { discordAccountId: UserAttribs['discordAccountId'] } & ActionArgs
  ) {
    const { discordAccountId, transaction } = args;
    return await User.findOne({
      where: { discordAccountId },
      transaction,
      ...User.FIND_OPTS.auth,
    });
  }

  //revoke

  // 디스코드 유저 정보 획득
  @ActionMethod({
    name: 'AUTH/DISCORD_PROFILE',
    type: 'HTTP',
  })
  public async getDiscordProfile(
    args: { tokens: OAuth.TokenRequestResult } & ActionArgs
  ): Promise<OAuth.User> {
    const { tokens } = args;
    if (!tokens.access_token) {
      throw new DiscordAuthError('AUTH/DISCORD/NF_ACCESS_TOKEN');
    }
    try {
      //identify scope 필요, email scope 추가하면 email 획득 가능
      const data = await this.client.getUser(tokens.access_token);

      //추가 가공 해야할까요?
      return data;
    } catch (error) {
      throw new DiscordAuthError({ code: 'AUTH/DISCORD/UA_PROFILE', error });
    }
  }

  //토큰 발급
  @ActionMethod({
    name: 'AUTH/DISCORD_TOKENS',
    type: 'HTTP',
  })
  public async getDiscordTokens(
    args: { code?: string } & ActionArgs
  ): Promise<OAuth.TokenRequestResult> {
    const { code } = args;
    if (!code) throw new DiscordAuthError('AUTH/DISCORD/NF_CODE');
    try {
      const tokens = await this.client.tokenRequest({
        code: code,
        scope: ['identify', 'guilds'],
        grantType: 'authorization_code',
      });

      return tokens;
    } catch (error) {
      throw new DiscordAuthError({ code: 'AUTH/DISCORD/UA_TOKEN', error });
    }
  }

  //디스코드 서버 id 획득
  public async getDiscordGuildId(
    access_token: string
  ): Promise<OAuth.PartialGuild[]> {
    if (!access_token) {
      throw new Error();
    }
    try {
      // guild scope 필요
      const guild = await this.client.getUserGuilds(access_token);

      return guild;
    } catch (error) {
      throw new Error();
    }
  }

  // 유저의 서버에 관련된 정보 획득 - 서버에서의 역할 등
  public async getDiscordGuildMember(
    access_token: string,
    guildId: string
  ): Promise<OAuth.Member> {
    if (!access_token || !guildId) {
      throw new Error();
    }
    try {
      const mem = await this.client.getGuildMember(access_token, guildId);

      return mem;
    } catch (error) {
      throw new Error();
    }
  }
}

export const discordAuth = new DiscordAuthService();
