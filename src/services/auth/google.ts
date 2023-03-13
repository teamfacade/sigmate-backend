import { google, people_v1 } from 'googleapis';
import { OAuth2Client, Credentials } from 'google-auth-library';
import axios, { AxiosError } from 'axios';
import qs from 'qs';
import AuthService, { AuthenticateDTO } from '.';
import { ActionArgs, ActionMethod } from '../../utils/action';
import GoogleAuthError from '../../errors/auth/google';
import User, { UserAttribs } from '../../models/User.model';
import { account } from '../account';
import AccountError from '../../errors/account';
import { DateTime, DurationLike } from 'luxon';

type SupportedSchemas =
  | people_v1.Schema$Name
  | people_v1.Schema$EmailAddress
  | people_v1.Schema$CoverPhoto
  | people_v1.Schema$Locale;

export type ParsedGoogleProfile = {
  id: string;
  email: string;
  displayName: string;
  photo: string;
  locale: string;
};

export default class GoogleAuthService extends AuthService {
  static INTERVAL_GOOGLE_CHANGE: DurationLike = { month: 1 };

  private REDIRECT_URI = Object.freeze({
    development: 'http://localhost:3000/auth',
    test: 'https://beta.sigmate.io/auth',
    production: 'https://sigmate.io/auth',
  });
  private OAUTH_SCOPE = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
  ];
  private PEOPLE_PERSON_FIELDS =
    'names,emailAddresses,metadata,coverPhotos,locales,photos';

  private __client?: OAuth2Client;
  private get client() {
    if (!this.__client)
      throw new Error('GoogleAuthService: Client not initialized');
    return this.__client;
  }
  private __authorizationUrl?: string;
  public get authorizationUrl() {
    if (!this.__authorizationUrl)
      throw new Error('GoogleAuthService: AuthorizationUrl not set');
    return this.__authorizationUrl;
  }
  private __people?: people_v1.People;
  private get people() {
    if (!this.__people)
      throw new Error('GoogleAuthService: People API client not initialized');
    return this.__people;
  }

  constructor() {
    super('GoogleAuth');
  }

  async start() {
    this.setStatus('STARTING');

    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      this.REDIRECT_URI[this.env]
    );

    this.__authorizationUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: this.OAUTH_SCOPE,
      include_granted_scopes: true,
    });

    this.__people = google.people('v1');
    this.__client = client;

    this.setStatus('AVAILABLE');
  }

  async close() {
    this.setStatus('CLOSED');
  }

  @ActionMethod({
    name: 'AUTH/GOOGLE_AUTH',
    type: 'COMPLEX',
  })
  public async authenticate(args: AuthenticateDTO & ActionArgs) {
    const { google, req, action } = args;
    if (!google) throw new Error('GoogleAuthService: Code not provided');
    const { code } = google;
    // Call Google APIs to authenticate
    const tokens = await this.getGoogleTokens({ code, parentAction: action });
    const profile = await this.getGoogleProfile({
      tokens,
      parentAction: action,
    });

    // Check if user exists
    const googleAccountId = profile.id;
    let user: User | null = await this.findUser({
      googleAccountId,
      parentAction: action,
    });
    if (!user) {
      // If not, create an account
      user = await account.create({
        google: {
          fullName: profile.displayName,
          googleAccount: profile.email,
          googleAccountId: profile.id,
          profileImageUrl: profile.photo,
          locale: profile.locale,
          googleRefreshToken: tokens.refresh_token || undefined,
        },
        parentAction: action,
      });
    }
    if (req) req.user = user || undefined;
    return user;
  }

  @ActionMethod({ name: 'AUTH/GOOGLE_CONNECT', type: 'COMPLEX' })
  public async connect(args: { code: string; user: User } & ActionArgs) {
    const { code, user, transaction, action } = args;
    const tokens = await this.getGoogleTokens({ code, parentAction: action });
    const profile = await this.getGoogleProfile({
      tokens,
      parentAction: action,
    });

    const { id, email, photo } = profile;

    const alreadyExists = await User.findOne({
      where: { googleAccountId: profile.id },
      transaction,
    });
    if (alreadyExists) {
      throw new AccountError('ACCOUNT/CF_CONNECT_GOOGLE_ALREADY_EXISTS');
    }

    await account.connectGoogle({
      user,
      google: {
        googleAccount: email,
        googleAccountId: id,
        profileImageUrl: photo,
        googleRefreshToken: tokens.refresh_token || undefined,
      },
      parentAction: action,
    });

    return user;
  }

  @ActionMethod({ name: 'AUTH/GOOGLE_DISCONNECT', type: 'COMPLEX' })
  public async disconnect(args: { user: User } & ActionArgs) {
    const { user, transaction, action } = args;

    this.checkCanChangeGoogle(user);
    if (!user.googleAccountId) {
      throw new GoogleAuthError('AUTH/GOOGLE/NF_GOOGLE');
    }

    const auth = user.auth || (await user.$get('auth', { transaction }));
    if (!auth) throw new GoogleAuthError('AUTH/GOOGLE/NF_AUTH');

    // Revoke OAuth ID token
    // Removes Sigmate from Google account's authorized apps list
    if (auth.googleRefreshToken) {
      await this.revoke({
        googleRefreshToken: auth.googleRefreshToken,
        parentAction: action,
        throws: false,
      });
    }

    // Remove Google information from our database
    user.set('googleAccount', null);
    user.set('googleAccountId', null);
    user.set('googleUpdatedAt', null);
    user.set('isGooglePublic', null);
    auth.set('googleRefreshToken', null);

    await user.save({ transaction });
    await auth.save({ transaction });

    return user;
  }

  private checkCanChangeGoogle(user: User) {
    const googleUpdatedAt = user.googleUpdatedAt;
    if (googleUpdatedAt) {
      const updatedAt = DateTime.fromJSDate(googleUpdatedAt);
      const canUpdateFrom = updatedAt.plus(
        GoogleAuthService.INTERVAL_GOOGLE_CHANGE
      );
      if (canUpdateFrom > DateTime.now()) {
        throw new GoogleAuthError('AUTH/GOOGLE/RJ_CHANGE_INTERVAL');
      }
    }
  }

  @ActionMethod('AUTH/GOOGLE_FIND_USER')
  private async findUser(
    args: { googleAccountId: UserAttribs['googleAccountId'] } & ActionArgs
  ) {
    const { googleAccountId, transaction } = args;
    return await User.findOne({
      where: { googleAccountId },
      transaction,
      ...User.FIND_OPTS.auth,
    });
  }

  @ActionMethod({ name: 'AUTH/GOOGLE_REVOKE', type: 'HTTP' })
  public async revoke(
    args: { googleRefreshToken: string; throws?: boolean } & ActionArgs
  ) {
    const { googleRefreshToken, throws = true, action } = args;
    try {
      await axios({
        url: 'https://oauth2.googleapis.com:443/revoke',
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        data: qs.stringify({ token: googleRefreshToken }),
      });
    } catch (err) {
      console.error(err);
      let message = '';
      let error: unknown = undefined;
      if (err instanceof AxiosError) {
        if (err.response) {
          message = `${err.response.status} ${
            err.response.statusText
          }: ${JSON.stringify(err.response.data)}`;
        } else if (err.request) {
          message = 'Google OAuth not responding';
        } else {
          message = `${err.name} ${err.message}`;
          error = err;
        }
      } else {
        error = err;
      }

      // The google refresh token from the DB may not work
      const gaError = new GoogleAuthError({
        code: 'AUTH/GOOGLE/UA_REVOKE',
        message,
        error,
      });
      if (throws) {
        throw gaError;
      } else {
        action?.logEvent(
          'warn',
          'ACT/WARNING',
          'Google OAuth token revoke failed',
          gaError
        );
      }
    }
  }

  @ActionMethod({
    name: 'AUTH/GOOGLE_PROFILE',
    type: 'HTTP',
  })
  private async getGoogleProfile(args: { tokens: Credentials } & ActionArgs) {
    const { tokens } = args;
    if (!tokens?.access_token) {
      throw new GoogleAuthError('AUTH/GOOGLE/NF_ACCESS_TOKEN');
    }
    this.client.setCredentials(tokens);
    google.options({ auth: this.client });

    let rawProfile: people_v1.Schema$Person;
    try {
      const { data } = await this.people.people.get({
        resourceName: 'people/me',
        personFields: this.PEOPLE_PERSON_FIELDS,
      });
      rawProfile = data;
    } catch (error) {
      throw new GoogleAuthError({ code: 'AUTH/GOOGLE/UA_PROFILE', error });
    }

    const profile = this.parseGoogleProfile(rawProfile);
    if (!profile.id || !profile.email) {
      const expected: (keyof ParsedGoogleProfile)[] = [
        'id',
        'email',
        'displayName',
        'photo',
        'locale',
      ];
      const missing: string[] = [];
      expected.forEach((key) => {
        if (!profile[key]) missing.push(key);
      });
      throw new GoogleAuthError({
        code: 'AUTH/GOOGLE/IV_PROFILE',
        message: missing.join(', '),
      });
    }

    return profile;
  }

  @ActionMethod({
    name: 'AUTH/GOOGLE_TOKENS',
    type: 'HTTP',
  })
  private async getGoogleTokens(args: { code?: string } & ActionArgs) {
    const { code } = args;
    if (!code) throw new GoogleAuthError('AUTH/GOOGLE/NF_CODE');
    try {
      const { tokens } = await this.client.getToken(code);
      return tokens;
    } catch (error) {
      throw new GoogleAuthError({ code: 'AUTH/GOOGLE/UA_TOKEN', error });
    }
  }

  private parseGoogleProfile(
    data: people_v1.Schema$Person
  ): ParsedGoogleProfile {
    const id = data.resourceName ? data.resourceName.split('people/')[1] : '';

    // People API returns a list of data
    // In case there are multiple data in a dataset, choose the primary one
    // e.g. If user has multiple emails (primary, secondary,...), choose the primary one.
    const primaryDataFilter = (data: SupportedSchemas) => {
      return data?.metadata?.primary && data?.metadata?.source?.id === id;
    };
    let names = data.names ? data.names.filter(primaryDataFilter) : [];
    let emails = data.emailAddresses
      ? data.emailAddresses.filter(primaryDataFilter)
      : [];
    // let coverPhotos = data.coverPhotos
    //   ? data.coverPhotos.filter(primaryDataFilter)
    //   : [];
    let locales = data.locales ? data.locales.filter(primaryDataFilter) : [];
    let photos = data.photos ? data.photos.filter(primaryDataFilter) : [];

    // If the filter returned nothing, just use the unfiltered results
    names = names.length > 0 ? names : data.names || [];
    emails = emails.length > 0 ? emails : data.emailAddresses || [];
    // coverPhotos = coverPhotos.length > 0 ? coverPhotos : data.coverPhotos || [];
    locales = locales.length > 0 ? locales : data.locales || [];
    photos = photos.length > 0 ? photos : data.photos || [];

    // Get the data. Fallback to empty string if not found.
    const displayName = (names.length > 0 && names[0].displayName) || '';
    const email = (emails.length > 0 && emails[0].value) || '';
    // const coverPhoto = (coverPhotos.length > 0 && coverPhotos[0].url) || '';
    const locale = (locales.length > 0 && locales[0].value) || '';
    const photo = (photos.length > 0 && photos[0].url) || '';

    return {
      id,
      email,
      displayName,
      photo,
      // coverPhoto,
      locale,
    };
  }
}

export const googleAuth = new GoogleAuthService();
