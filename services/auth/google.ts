import { google, people_v1 } from 'googleapis';
import { Credentials } from 'google-auth-library';
import { APIError } from '../../middlewares/apiErrorHandler';
import UserAuth from '../../models/user/UserAuth';
import DatabaseError from '../../utilities/errors/DatabaseError';
import { BaseError } from 'sequelize';

export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3000/oauth/google/callback'
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
 */
export const getGoogleTokens = async (code: string) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    google.options({ auth: oauth2Client });
    return tokens;
  } catch (error) {
    // TODO Handle Google token fetch error
    const err = error as APIError;
    err.status = 500;
    err.cause = 'ERR_OAUTH_GOOGLE';
    throw error;
  }
};

export const updateGoogleTokens = async (
  userId: string,
  googleTokens: Credentials
) => {
  const updateValues: {
    googleAccessToken?: string;
    googleRefreshToken?: string;
  } = {
    googleAccessToken: googleTokens.access_token || '',
    googleRefreshToken: googleTokens.refresh_token || '',
  };

  if (!updateValues.googleAccessToken) delete updateValues.googleAccessToken;

  if (!updateValues.googleRefreshToken) delete updateValues.googleRefreshToken;

  try {
    await UserAuth.update(updateValues, { where: { userId } });
  } catch (error) {
    throw new DatabaseError(error as BaseError);
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
};

/**
 * Calls Google People API (v1) and extracts necessary information from the API response.
 * getGoogleTokens method must have been called at least once before using this method
 * @returns Google profile data
 */
export const getGoogleProfile = async () => {
  // Call the Google People API
  let data: people_v1.Schema$Person;
  try {
    const response = await people.people.get({
      resourceName: 'people/me',
      personFields: 'names,emailAddresses,metadata,coverPhotos,locales',
    });
    data = response.data;
  } catch (error) {
    const err = error as APIError;
    err.status = 500;
    err.cause = 'ERR_OAUTH_GOOGLE_PEOPLE';
    throw error;
  }

  // Unique identifier for this Google Account
  const id = data.resourceName ? data.resourceName.split('people/')[1] : '';

  // People API returns a list of data
  // In case there are multiple data in a dataset, choose the primary one
  // e.g. If user has multiple emails (primary, secondary,...), choose the primary one.
  const primaryDataFilter = (data: SupportedSchemas) => {
    return data?.metadata?.primary && data?.metadata?.source?.id === id;
  };
  const names = data.names ? data.names.filter(primaryDataFilter) : [];
  const emails = data.emailAddresses
    ? data.emailAddresses.filter(primaryDataFilter)
    : [];
  const coverPhotos = data.coverPhotos
    ? data.coverPhotos.filter(primaryDataFilter)
    : [];
  const locales = data.locales ? data.locales.filter(primaryDataFilter) : [];

  // Get the data. Fallback to empty string if not found.
  const displayName = (names.length > 0 && names[0].displayName) || '';
  const email = (emails.length > 0 && emails[0].value) || '';
  const coverPhoto = (coverPhotos.length > 0 && coverPhotos[0].url) || '';
  const locale = (locales.length > 0 && locales[0].value) || '';

  // Return the constructed profile object
  const googleProfile = {
    id,
    displayName,
    email,
    coverPhoto,
    locale,
  };

  return googleProfile;
};
