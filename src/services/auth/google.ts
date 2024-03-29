import { NextFunction, Request, Response } from 'express';
import { google, people_v1 } from 'googleapis';
import ApiError from '../../utils/errors/ApiError';
import NotFoundError from '../../utils/errors/NotFoundError';
import { findUserByGoogleId } from '../database/auth';
import { createUserGoogle } from '../database/user';
import { AuthResponse, sigmateLogin } from '.';
import { userToJSON } from '../user';

const redirectUri = {
  development: 'http://localhost:3000/auth',
  test: 'https://beta.sigmate.io/auth',
  production: 'https://sigmate.io/auth',
};

export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  redirectUri[process.env.NODE_ENV || 'production']
);

const scope = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
];

/**
 * The URL to redirect the users to in order to perform Sign in with Google.
 */
export const authorizationUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope,
  include_granted_scopes: true,
});

const people = google.people('v1');

// After user approval, Google responds with an authentication code
// Use the authentication code to obtain refresh/access tokens.

/**
 * Obtains tokens using the authentication code that Google provided after user approval,
 * and sets the tokens in the oauthClient instance to authenticate Google API calls.
 * @param code Google OAuth 2.0 authentication code
 * @returns Tokens obtained from Google
 * @throws ApiError if Google server is not cooperating
 */
export const getGoogleTokens = async (code: string) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    google.options({ auth: oauth2Client });
    return tokens;
  } catch (googleError) {
    throw new ApiError('ERR_OAUTH_GOOGLE_TOKEN', {
      clientMessage: 'ERR_OAUTH_GOOGLE',
    });
  }
};

// For use in function primaryDataFilter, within function 'getGoogleProfile'
type SupportedSchemas =
  | people_v1.Schema$Name
  | people_v1.Schema$EmailAddress
  | people_v1.Schema$CoverPhoto
  | people_v1.Schema$Locale;

export type GoogleProfile = {
  id: string;
  displayName: string;
  email: string;
  coverPhoto: string;
  locale: string;
  photo: string;
};

/**
 * Calls Google People API (v1) and extracts necessary information from the API response.
 * getGoogleTokens method must have been called at least once before using this method
 * @returns Google profile data
 * @throws ApiError if Google server is not cooperating
 */
export const getGoogleProfile = async () => {
  // Call the Google People API
  let data: people_v1.Schema$Person;
  try {
    const response = await people.people.get({
      resourceName: 'people/me',
      personFields: 'names,emailAddresses,metadata,coverPhotos,locales,photos',
    });
    data = response.data;
  } catch (googleError) {
    throw new ApiError('ERR_OAUTH_GOOGLE_PEOPLE', {
      clientMessage: 'ERR_OAUTH_GOOGLE',
    });
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
  const googleProfile: GoogleProfile = {
    id,
    displayName,
    email,
    coverPhoto,
    locale,
    photo,
  };

  return googleProfile;
};

export const redirectGoogleOauth = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!authorizationUrl) {
    return next(new ApiError('ERR_GOOGLE_OAUTH_AU'));
  }
  res.redirect(authorizationUrl);
};

export const handleGoogleOauth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Call Google APIs
    const { code } = req.body;
    const googleTokens = await getGoogleTokens(code);
    const googleProfile = await getGoogleProfile();

    if (!googleProfile.id) {
      throw new NotFoundError('ERR_GOOGLE_OAUTH');
    }

    // Check if user already exists
    const user = await findUserByGoogleId(googleProfile.id);

    let status = 200;
    const response: AuthResponse = { success: true } as AuthResponse;
    if (user) {
      // returning user (login)
      const newTokens = await sigmateLogin(user);

      // Make sure to return the renewed tokens
      response.accessToken =
        newTokens.sigmateAccessToken || user.userAuth?.sigmateAccessToken;
      response.refreshToken =
        newTokens.sigmateRefreshToken || user.userAuth?.sigmateRefreshToken;

      // Send user information back to the user
      response.user = userToJSON(user);
    } else {
      // new user (sign up)
      const user = await createUserGoogle(googleTokens, googleProfile);
      response.accessToken = user.userAuth?.sigmateAccessToken;
      response.refreshToken = user.userAuth?.sigmateRefreshToken;

      // Send user information back to the user
      response.user = userToJSON(user);
      status = 201;
    }

    res.status(status).json(response);
  } catch (error) {
    return next(error);
  }
};
