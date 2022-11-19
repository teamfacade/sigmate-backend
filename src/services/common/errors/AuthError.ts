import RequestError, { HttpStatusCode } from './RequestError';

export default class AuthError extends RequestError {
  static MESSAGES = {
    // UNEXPECTED
    // AuthService.start has not been called before instance init
    'SERVICE/INIT': 'ERR_AUTH_SERVICE_NOT_STARTED',
    // AuthService.reloadUser fail
    'USER/RELOAD': 'ERR_AUTH_USER_RELOAD',
    // AuthService.findUser invalid args
    'USER/FIND': 'ERR_AUTH_USER_FIND',
    // AuthService.getGoogleProfile fail
    'GOOGLE/PROFILE': 'ERR_AUTH_GOOGLE_PROFILE',
    'GOOGLE/METHOD': 'ERR_AUTH_GOOGLE_UNEXPECTED_METHOD',
    'METAMASK/NONCE': 'ERR_AUTH_METAMASK_NONCE',
    'METAMASK/NONCE_GEN': 'ERR_AUTH_METAMASK_NONCE_GEN',
    'METAMASK/VERIFY': 'ERR_AUTH_METAMASK_VERIFY',
    'METAMASK/METHOD': 'ERR_AUTH_GOOGLE_UNEXPECTED_METHOD',
    'JWT/METHOD': 'ERR_AUTH_JWT_UNEXPECTED_METHOD',
    'JWT/VERIFY': 'ERR_JWT_VERIFY',

    // EXPECTED
    // setUser fail
    'USER/SET': 'ERR_AUTH_USER_SET',
    // AuthService.signinGoogle code not provided
    'GOOGLE/CODE': 'ERR_AUTH_GOOGLE_CODE',
    // AuthService.getGoogleTokens fail
    'GOOGLE/TOKENS': 'ERR_AUTH_OAUTH_GOOGLE_TOKENS',
    'METAMASK/WALLET': 'ERR_AUTH_METAMASK_WALLET',
    'METAMASK/SIGNATURE': 'ERR_AUTH_METAMASK_SIGNATURE',
    'DEVICE/BANNED': 'ERR_AUTH_DEVICE_BANNED',
    'USER/BANNED': 'ERR_AUTH_USER_BANNED',
    'USER/UNAUTHENTICATED': 'ERR_AUTH_USER_UNAUTHENTICATED',
    'USER/FORBIDDEN': 'ERR_AUTH_USER_FORBIDDEN',
    'USER/CONFLICT/REFERRAL': 'ERR_AUTH_USER_REFERRAL_ALREADY_EXISTS',
  };
  constructor(
    message: keyof typeof AuthError['MESSAGES'],
    origin: unknown | undefined = undefined
  ) {
    let status: HttpStatusCode = 500;
    let unexpected = origin === undefined ? false : true;
    switch (message) {
      case 'GOOGLE/CODE':
      case 'METAMASK/WALLET':
      case 'METAMASK/SIGNATURE':
        status = 400;
        break;
      case 'GOOGLE/TOKENS':
      case 'USER/UNAUTHENTICATED':
        status = 401;
        break;
      case 'USER/FORBIDDEN':
        status = 403;
        break;
      case 'USER/SET':
        status = 404;
        break;
      case 'USER/CONFLICT/REFERRAL':
        status = 409;
        break;
      case 'DEVICE/BANNED':
      case 'USER/BANNED':
        status = 418;
        break;
      default:
        status = 500;
        unexpected = true;
        break;
    }
    super(status, {
      name: 'AuthError',
      message: AuthError.MESSAGES[message],
      origin,
      unexpected,
    });
  }
}
