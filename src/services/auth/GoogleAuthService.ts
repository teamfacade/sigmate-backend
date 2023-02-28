import { OAuth2Client, Credentials } from 'google-auth-library';
import { google, people_v1 } from 'googleapis';
import User from '../../models/user/User.model';
import Action, { ActionArgs } from '../../utils/ActionNew';
import AccountService from '../AccountService';
import GoogleAuthError from '../errors/GoogleAuthError';
import AuthService from './AuthService';
import { tokenAuth } from './TokenAuthService';

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
  public static instance: GoogleAuthService;

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

  client: OAuth2Client;
  authorizationUrl: string;
  people: people_v1.People;

  constructor() {
    super({ name: 'GoogleAuth' });

    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      GoogleAuthService.REDIRECT_URI[process.env.NODE_ENV || 'production']
    );

    this.authorizationUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: GoogleAuthService.OAUTH_SCOPE,
      include_granted_scopes: true,
    });

    this.people = google.people('v1');
    this.client = client;

    this.setStatus('STARTED');
  }

  public connect = Action.create(
    async ({ code, action: parent }: ActionArgs<{ code: string }>) => {
      const tokens = await this.getGoogleTokens({ code, parent });
      const profile = await this.getGoogleProfile({ tokens, parent });
      const user = await this.findUser({ profile, parent });
      if (!user) throw new GoogleAuthError({ code: 'GOOGLE/NF_USER' });
      const account = new AccountService({ user });
      await account.update({
        google: {
          googleAccount: profile.email,
          googleAccountId: profile.id,
          profileImageUrl: profile.photo,
          googleRefreshToken: tokens.refresh_token,
        },
        parent,
      });
    },
    { name: 'AUTH_GOOGLE_CONNET' }
  );

  public disconnect = Action.create(
    async ({ user, action: parent }: ActionArgs<{ user?: User | null }>) => {
      const account = new AccountService({ user });
      await account.update({
        google: {
          googleAccount: null,
          googleAccountId: null,
          profileImageUrl: null,
          googleRefreshToken: null,
        },
        parent,
      });
    },
    { name: 'AUTH_GOOGLE_DISCONNECT' }
  );

  // Find/create user, insert/update information, add user to request, return user and token
  public authenticate = Action.create(
    async ({ code, action: parent, req }: ActionArgs<{ code: string }>) => {
      const tokens = await this.getGoogleTokens({ code, parent });
      const profile = await this.getGoogleProfile({ tokens, parent });

      let user = await this.findUser({ profile, parent });
      let created = false;

      if (user) {
        const account = new AccountService({ user });
        user = await account.update({
          google: {
            googleAccount: profile.email,
            googleAccountId: profile.id,
            profileImageUrl: profile.photo,
          },
          parent,
        });
      } else {
        created = true;
        const account = new AccountService();
        user = await account.create({
          google: {
            fullName: profile.displayName,
            googleAccount: profile.email,
            googleAccountId: profile.id,
            profileImageUrl: profile.photo,
            locale: profile.locale,
            googleRefreshToken: tokens.refresh_token || undefined,
          },
          parent,
        });
      }

      parent.setTarget(user);
      req?.util?.authenticate(user);

      const sigmateTokens = await tokenAuth.getToken({
        user,
        access: true,
        refresh: true,
        parent,
      });

      return { created, user, tokens: sigmateTokens };
    },
    { name: 'AUTH_GOOGLE_AUTHENTICATE', target: 'User' }
  );

  private findUser = Action.create(
    async ({
      profile,
      transaction,
    }: ActionArgs<{ profile: ParsedGoogleProfile }>) => {
      const user = await User.findOne({
        where: { googleAccountId: profile.id },
        ...User.FIND_OPTS.GOOGLE,
        transaction,
      });
      return user;
    },
    { name: 'AUTH_GOOGLE_FIND_USER', type: 'DATABASE' }
  );

  private getGoogleProfile = Action.create(
    async ({ tokens }: ActionArgs<{ tokens: Credentials }>) => {
      if (!tokens?.access_token) {
        throw new GoogleAuthError({ code: 'GOOGLE/NF_ACCESS_TOKEN' });
      }
      this.client.setCredentials(tokens);
      google.options({ auth: this.client });

      let rawProfile: people_v1.Schema$Person;
      try {
        const { data } = await this.people.people.get({
          resourceName: 'people/me',
          personFields: GoogleAuthService.PEOPLE_PERSON_FIELDS,
        });
        rawProfile = data;
      } catch (error) {
        throw new GoogleAuthError({ code: 'GOOGLE/ER_PROFILE_FETCH', error });
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
          code: 'GOOGLE/IV_PROFILE',
          message: missing.join(', '),
        });
      }

      return profile;
    },
    { name: 'AUTH_GOOGLE_PROFILE', type: 'HTTP' }
  );

  private getGoogleTokens = Action.create(
    async ({ code }: ActionArgs<{ code: string }>) => {
      if (!code) throw new GoogleAuthError({ code: 'GOOGLE/NF_CODE' });
      try {
        const { tokens } = await this.client.getToken(code);
        return tokens;
      } catch (error) {
        throw new GoogleAuthError({ code: 'GOOGLE/ER_TOKEN_FETCH', error });
      }
    },
    { name: 'AUTH_GOOGLE_TOKEN', type: 'HTTP' }
  );

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
