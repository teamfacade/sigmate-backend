import { OAuth2Client, Credentials } from 'google-auth-library';
import { google, people_v1 } from 'googleapis';
import Auth, { AuthenticateDTO, AuthenticateResponse, AuthOptions } from '.';
import Action from '../Action';
import { GoogleAuthError } from '../errors/GoogleAuthError';
import Token from './Token';

type SupportedSchemas =
  | people_v1.Schema$Name
  | people_v1.Schema$EmailAddress
  | people_v1.Schema$CoverPhoto
  | people_v1.Schema$Locale;

type OAuthDTO = {
  code: string;
};

type GoogleOAuthReturn = {
  id: string;
  displayName: string;
  email: string;
  // coverPhoto: string;
  photo: string;
  locale: string;
  access_token?: string | null;
  refresh_token?: string | null;
};

type SignupDTO = GoogleOAuthReturn;

export default class GoogleAuth extends Auth {
  static REDIRECT_URI = Object.freeze({
    development: 'http://localhost:3000/auth',
    test: 'https://beta.sigmate.io/auth',
    production: 'https://sigmate.io/auth',
  });
  static OAUTH_SCOPE = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
  ];
  static PEOPLE_PERSON_FIELDS =
    'names,emailAddresses,metadata,coverPhotos,locales,photos';

  static client: OAuth2Client;
  static authorizationUrl: string;
  static people: people_v1.People;

  static googleStart() {
    GoogleAuth.status = GoogleAuth.STATE.STARTING;
    GoogleAuth.client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      GoogleAuth.REDIRECT_URI[process.env.NODE_ENV || 'production']
    );
    GoogleAuth.authorizationUrl = GoogleAuth.client.generateAuthUrl({
      access_type: 'offline',
      scope: GoogleAuth.OAUTH_SCOPE,
      include_granted_scopes: true,
    });
    GoogleAuth.people = google.people('v1');
    GoogleAuth.status = GoogleAuth.STATE.STARTED;
  }

  name = 'AUTH_GOOGLE';

  get serviceStatus() {
    return GoogleAuth.status;
  }

  constructor(options: AuthOptions = {}) {
    super(options);
  }

  private parseGoogleProfile(data: people_v1.Schema$Person) {
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

  private async googleOAuth(
    dto: OAuthDTO,
    parentAction: Action | undefined = undefined
  ): Promise<GoogleOAuthReturn> {
    const action = new Action({
      type: Action.TYPE.SERVICE,
      name: 'GOOGLE_OAUTH',
      transaction: false,
      parent: parentAction,
    });
    const { code } = dto;
    return await action.run(async ({ action }) => {
      // Empty args
      if (!code) {
        throw new GoogleAuthError({ code: 'GOOGLE/IV_DTO' });
      }

      // Get Google Tokens
      const getTokens = new Action({
        type: Action.TYPE.HTTP,
        name: 'GOOGLE_TOKENS',
        parent: action,
      });
      const tokens = await getTokens.run(async () => {
        let tokens: Credentials;
        try {
          const res = await GoogleAuth.client.getToken(code);
          tokens = res.tokens;
        } catch (error) {
          throw new GoogleAuthError({
            code: 'GOOGLE/ER_TOKEN',
            error,
          });
        }
        return tokens;
      });

      // Check if we got token
      if (!tokens?.access_token) {
        throw new GoogleAuthError({
          code: 'GOOGLE/IV_TOKEN',
          message: Object.keys(tokens).join(', '),
        });
      }

      // Use tokens for future Google API calls
      GoogleAuth.client.setCredentials(tokens);
      google.options({ auth: GoogleAuth.client });

      // Get Google Profile
      const getProfile = new Action({
        type: Action.TYPE.HTTP,
        name: 'GOOGLE_PROFILE',
        parent: action,
      });
      const personFields = GoogleAuth.PEOPLE_PERSON_FIELDS;
      const data = await getProfile.run(async () => {
        const response = await GoogleAuth.people.people.get({
          resourceName: 'people/me',
          personFields,
        });
        return response?.data;
      });

      // Parse and return
      const profile = this.parseGoogleProfile(data);
      if (!profile.id || !profile.email) {
        const missing: string[] = [];
        for (const k in profile) {
          if (!profile[k as keyof typeof profile]) {
            missing.push(k);
          }
        }
        // this.onError({ type: 'PROFILE_EMPTY', message: missing.join(', ') });
        throw new GoogleAuthError({
          code: 'GOOGLE/IV_PROFILE',
          message: missing.join(', '),
        });
      }

      return { ...tokens, ...profile };
    });
  }

  private async signup(
    dto: SignupDTO,
    parentAction: Action | undefined = undefined
  ) {
    const action = new Action({
      type: Action.TYPE.SERVICE,
      name: 'GOOGLE_SIGNUP',
      transaction: true,
      parent: parentAction,
    });
    return await action.run(async ({ action }) => {
      const user = this.user;
      await user.create(
        {
          google: {
            email: dto.email,
            googleAccount: dto.email,
            googleAccountId: dto.id,
            profileImageUrl: dto.photo,
            locale: dto.locale,
          },
        },
        action
      );
      this.model = user.model?.auth;
      return user;
    });
  }

  public async authenticate(
    dto: AuthenticateDTO,
    parentAction: Action | undefined = undefined
  ): Promise<AuthenticateResponse> {
    if (!dto.google) throw new GoogleAuthError({ code: 'GOOGLE/IV_DTO' });
    const { connect, code } = dto.google;
    const action = new Action({
      type: Action.TYPE.SERVICE,
      name: 'GOOGLE_AUTHENTICATE',
      transaction: true,
      parent: parentAction,
    });
    return await action.run(async ({ action }) => {
      const user = this.user;

      if (connect) {
        // Connet Google account to already connected user
        if (!user.model) {
          throw new GoogleAuthError({
            code: 'USER/NF',
            message: 'User not found during Google connect',
          });
        }
        await user.reload({ options: 'AUTH_GOOGLE' }, action);
        const auth = user.model.auth;
        if (!auth) {
          throw new GoogleAuthError({
            code: 'AUTH/NF',
            message: 'Auth not found during Google connect',
          });
        }

        // TODO Chcek privileges

        // Perform the update
        const data = await this.googleOAuth({ code }, action);
        await user.update({
          googleAccount: data.email,
          googleAccountId: data.id,
          profileImageUrl: data.photo,
        });
        await user.updateAuth(
          {
            google: {
              googleAccessToken: data.access_token || undefined,
              googleRefreshToken: data.refresh_token || undefined,
            },
          },
          action
        );
      } else {
        const data = await this.googleOAuth({ code }, action);
        // Login / Sign up with Google
        await user.find(
          { googleAccountId: data.id, options: 'AUTH_GOOGLE' },
          action
        );
        if (user.found) {
          // returning user. login
          await user.updateAuth(
            {
              google: {
                googleAccessToken: data.access_token || undefined,
                googleRefreshToken: data.refresh_token || undefined,
              },
            },
            action
          );
        } else {
          // new user. sign up
          await this.signup(data, action);
        }
      }

      const accessToken = new Token({ type: 'ACCESS', user });
      const refreshToken = new Token({ type: 'REFRESH', user });
      this.model = user.model?.auth;

      return {
        user,
        accessToken: await accessToken.renew(action),
        refreshToken: await refreshToken.renew(action),
      };
    });
  }
}
