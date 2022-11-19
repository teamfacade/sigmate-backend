import { OAuth2Client } from 'google-auth-library';
import { google, people_v1 } from 'googleapis';
import AuthError from '../errors/AuthError';
import AuthService, { AuthServiceOptions } from './AuthService';

type SupportedSchemas =
  | people_v1.Schema$Name
  | people_v1.Schema$EmailAddress
  | people_v1.Schema$CoverPhoto
  | people_v1.Schema$Locale;

export default class GoogleAuthService extends AuthService {
  static REDIRECT_URI = {
    development: 'http://localhost:3000/auth',
    test: 'https://beta.sigmate.io/auth',
    production: 'https://beta.sigmate.io/auth',
  };
  static OAUTH_SCOPE = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  client: OAuth2Client;
  authorizationUrl: string;
  people: people_v1.People;

  constructor(options: AuthServiceOptions) {
    super(options);
    this.client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      GoogleAuthService.REDIRECT_URI[process.env.NODE_ENV]
    );
    this.authorizationUrl = this.client.generateAuthUrl({
      access_type: 'offline',
      scope: GoogleAuthService.OAUTH_SCOPE,
      include_granted_scopes: true,
    });
    this.people = google.people('v1');
  }

  private async getGoogleTokens(code: string) {
    try {
      const { tokens } = await this.client.getToken(code);
      this.client.setCredentials(tokens);
      google.options({ auth: this.client });
      return tokens;
    } catch (error) {
      throw new AuthError('GOOGLE/TOKENS', error);
    }
  }

  private async getGoogleProfile() {
    const people = this.people.people;
    let data: people_v1.Schema$Person;
    try {
      const response = await people.get({
        resourceName: 'people/me',
        personFields:
          'names,emailAddresses,metadata,coverPhotos,locales,photos',
      });
      data = response.data;
    } catch (error) {
      throw new AuthError('GOOGLE/PROFILE', error);
    }

    // Unique identifier for this Google Account
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
    let coverPhotos = data.coverPhotos
      ? data.coverPhotos.filter(primaryDataFilter)
      : [];
    let locales = data.locales ? data.locales.filter(primaryDataFilter) : [];
    let photos = data.photos ? data.photos.filter(primaryDataFilter) : [];

    // If the filter returned nothing, just use the unfiltered results
    names = names.length > 0 ? names : data.names || [];
    emails = emails.length > 0 ? emails : data.emailAddresses || [];
    coverPhotos = coverPhotos.length > 0 ? coverPhotos : data.coverPhotos || [];
    locales = locales.length > 0 ? locales : data.locales || [];
    photos = photos.length > 0 ? photos : data.photos || [];

    // Get the data. Fallback to empty string if not found.
    const displayName = (names.length > 0 && names[0].displayName) || '';
    const email = (emails.length > 0 && emails[0].value) || '';
    const coverPhoto = (coverPhotos.length > 0 && coverPhotos[0].url) || '';
    const locale = (locales.length > 0 && locales[0].value) || '';
    const photo = (photos.length > 0 && photos[0].url) || '';

    // Return the constructed profile object
    const googleProfile: sigmate.Auth.GoogleProfile = {
      id,
      displayName,
      email,
      coverPhoto,
      photo,
      locale,
    };

    return googleProfile;
  }

  public async authenticate(
    method: sigmate.Auth.AuthMethod,
    dto: sigmate.Auth.AuthDTO
  ) {
    if (method !== 'google' || !dto.google)
      throw new AuthError('GOOGLE/METHOD');
    const { code } = dto.google;
    const tokens = await this.getGoogleTokens(code);
    const profile = await this.getGoogleProfile();

    // await this.setUser({ googleAccountId: profile.id }, false);
    await this.user.find({ googleAccountId: profile.id }, { set: true });

    if (!this.user) {
      // New user
      await this.signup({
        email: profile.email,
        googleAccount: profile.email,
        googleAccountId: profile.id,
        profileImageUrl: profile.photo,
        googleAccessToken: tokens.access_token || undefined,
        googleRefreshToken: tokens.refresh_token || undefined,
      });
    } else {
      await this.user.update({
        googleAccount: profile.email,
        profileImageUrl: profile.photo,
      });
    }
  }
}
