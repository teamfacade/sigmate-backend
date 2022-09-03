import jwt from 'jsonwebtoken';
import { Transaction } from 'sequelize';
import { BaseError } from 'sequelize';
import AdminUser from '../../models/AdminUser';
import User, { UserAttributes } from '../../models/User';
import UserAuth, { UserAuthDTO } from '../../models/UserAuth';
import UserGroup from '../../models/UserGroup';
import UserProfile from '../../models/UserProfile';
import ConflictError from '../../utils/errors/ConflictError';
import SequelizeError from '../../utils/errors/SequelizeError';
import UnauthenticatedError from '../../utils/errors/UnauthenticatedError';
import { generateNonce } from '../auth/metamask';
import {
  createAccessToken,
  createRefreshToken,
  getECPublicKey,
  JWT_ALG,
  JWT_ISS,
  JWT_TYP_ACCESS,
  JWT_TYP_REFRESH,
  SigmateJwtPayload,
} from '../auth/token';

export const findUserByGoogleId = async (
  googleAccountId: UserAttributes['googleAccountId']
) => {
  try {
    return await User.findOne({
      where: { googleAccountId },
      include: [UserGroup, UserProfile, UserAuth],
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const findUserByAccessToken = async (accessToken: string) => {
  // No need to bother if accessToken is falsy
  if (!accessToken) return null;

  // Decode jwt
  const tokenData: {
    tok?: string;
    group?: string;
    userId?: string;
    isAdmin?: string;
  } = {};

  try {
    const decodedToken = jwt.verify(accessToken, getECPublicKey(), {
      issuer: JWT_ISS,
      algorithms: [JWT_ALG],
    }) as SigmateJwtPayload;

    tokenData.tok = decodedToken.tok;
    tokenData.group = decodedToken.group;
    tokenData.userId = decodedToken.sub;
    tokenData.isAdmin = decodedToken.isAdmin;
  } catch (tokenError) {
    // Invalid token
    return null;
  }

  const { tok, group, userId, isAdmin } = tokenData;

  if (group === undefined || userId === undefined || isAdmin === undefined) {
    // required information missing
    return null;
  }

  if (tok !== JWT_TYP_ACCESS) {
    // wrong type of token
    return null;
  }

  // Compare token with DB
  try {
    const user = await User.findOne({
      where: { id: userId, isAdmin },
      include: [
        UserGroup,
        UserAuth,
        UserProfile,
        { model: AdminUser, as: 'adminUser' },
        { model: User, as: 'referredBy' },
      ],
    });

    // User not found
    if (!user) {
      return null;
    }

    // Wrong group name
    if (user?.group.id !== group) {
      return null;
    }

    // Wrong access token
    if (user.userAuth?.sigmateAccessToken !== accessToken) {
      return null;
    }

    return user;
  } catch (error) {
    throw new SequelizeError(error as BaseError);
  }
};

export const findUserByRefreshToken = async (refreshToken: string) => {
  // No need to bother if accessToken is falsy
  if (!refreshToken) return null;

  // Decode jwt
  const tokenData: {
    tok?: string;
    group?: string;
    userId?: string;
    isAdmin?: string;
  } = {};

  try {
    const decodedToken = jwt.verify(refreshToken, getECPublicKey(), {
      issuer: JWT_ISS,
      algorithms: [JWT_ALG],
    }) as SigmateJwtPayload;

    tokenData.tok = decodedToken.tok;
    tokenData.group = decodedToken.group;
    tokenData.userId = decodedToken.sub;
    tokenData.isAdmin = decodedToken.isAdmin;
  } catch (tokenError) {
    // Invalid token
    return null;
  }

  const { tok, group, userId, isAdmin } = tokenData;

  if (group === undefined || userId === undefined || isAdmin === undefined) {
    // required information missing
    return null;
  }

  if (tok !== JWT_TYP_REFRESH) {
    // wrong type of token
    return null;
  }

  // Compare token with DB
  try {
    const user = await User.findOne({
      where: { id: userId, isAdmin },
      include: [UserGroup, UserAuth],
    });

    // User not found
    if (!user) return null;

    // Wrong group name
    if (user.group?.id !== group) return null;

    // Wrong or expired access token
    if (user.userAuth?.sigmateRefreshToken !== refreshToken) return null;

    return user;
  } catch (error) {
    throw new SequelizeError(error as BaseError);
  }
};

export const renewTokens = async (
  user: User | null | undefined,
  options: {
    accessToken: boolean;
    refreshToken: boolean;
    transaction?: Transaction;
  } = {
    accessToken: true,
    refreshToken: false,
  }
) => {
  // Check if user object is valid
  if (!user) throw new UnauthenticatedError();
  const userId = user.id;
  let userAuth: UserAuth | null = user.userAuth || null;
  if (!userAuth) {
    userAuth = await user.$get('userAuth');
  }
  let userGroup: UserGroup | null = user.group;
  if (!userGroup) {
    userGroup = await user.$get('group');
  }
  const isAdmin = user.isAdmin || false;
  if (!userId || !userAuth || !userGroup) throw new UnauthenticatedError();

  // Check options
  const {
    accessToken: shouldRenewAccessToken = false,
    refreshToken: shouldRenewRefreshToken = false,
    transaction,
  } = options;
  const userAuthDTO: UserAuthDTO = {};
  if (!shouldRenewAccessToken && !shouldRenewRefreshToken) return userAuthDTO;

  // Generate fresh tokens
  if (shouldRenewAccessToken) {
    userAuthDTO.sigmateAccessToken = createAccessToken(
      userId,
      userGroup.id,
      isAdmin
    );
  }

  if (shouldRenewRefreshToken) {
    userAuthDTO.sigmateRefreshToken = createRefreshToken(
      userId,
      userGroup.id,
      isAdmin
    );
  }

  // Update the database
  try {
    await userAuth.update(userAuthDTO, { transaction });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }

  return userAuthDTO;
};

export const renewAccessToken = async (
  user: User | null | undefined,
  transaction: Transaction | undefined = undefined
) => {
  const { sigmateAccessToken } = await renewTokens(user, {
    accessToken: true,
    refreshToken: false,
    transaction,
  });
  return sigmateAccessToken;
};

export const renewRefreshToken = async (
  user: User | null | undefined,
  transaction: Transaction | undefined = undefined
) => {
  return await renewTokens(user, {
    accessToken: true,
    refreshToken: true,
    transaction,
  });
};

export const voidAccessToken = async (user: User | null | undefined) => {
  try {
    if (!user) throw new UnauthenticatedError();
    const userAuth = user.userAuth || (await user.$get('userAuth'));
    if (!userAuth) throw new UnauthenticatedError();
    await userAuth.update({ sigmateAccessToken: '' });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const voidRefreshToken = async (user: User | null | undefined) => {
  try {
    if (!user) throw new UnauthenticatedError();
    const userAuth = user.userAuth || (await user.$get('userAuth'));
    if (!userAuth) throw new UnauthenticatedError();
    await userAuth.update({ sigmateAccessToken: '', sigmateRefreshToken: '' });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const renewMetaMaskNonce = async (user: User | null | undefined) => {
  try {
    if (!user) throw new UnauthenticatedError();
    const userAuth = user.userAuth || (await user.$get('userAuth'));
    if (!userAuth) throw new ConflictError();
    const nonce = generateNonce();
    await userAuth.update({ metamaskNonce: nonce });
    return nonce;
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};
