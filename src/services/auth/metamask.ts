import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import BadRequestError from '../../utils/errors/BadRequestError';
import ConflictError from '../../utils/errors/ConflictError';
import NotFoundError from '../../utils/errors/NotFoundError';
import {
  createUserMetamask,
  findUserByMetamaskWallet,
  getMetaMaskNonce,
} from '../database/user';
import ethUtil from 'ethereumjs-util';
import UnauthenticatedError from '../../utils/errors/UnauthenticatedError';
import { AuthResponse, sigmateLogin } from '.';
import { userToJSON } from '../user';

export const generateNonce = () => {
  return crypto.randomInt(10000000, 999999999);
};

export const getSignMessage = (nonce: string | number): string => {
  if (typeof nonce === 'number') nonce = nonce.toString();
  return 'I am signing my one-time nonce: ' + nonce;
};

export const getUserByMetamaskWalletController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const metamaskWallet = (req.query.metamaskWallet as string) || '';
    let user = await findUserByMetamaskWallet(metamaskWallet);
    if (!user) {
      // A new user is signing up! Create a new user
      user = await createUserMetamask(metamaskWallet);
    }
    // Get the user's Metamask nonce from the DB
    const nonce = getMetaMaskNonce(user);

    res.status(200).json({ success: true, metamaskWallet, nonce });
  } catch (error) {
    next(error);
  }
};

export const metamaskAuthController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Look for user with the given Metamask public address
    // and obtain Metamask nonce from database
    const { metamaskWallet, signature } = req.body;
    if (!metamaskWallet) throw new BadRequestError();
    const user = await findUserByMetamaskWallet(metamaskWallet);
    if (!user) throw new NotFoundError(); // User not found
    const userAuth = await user.$get('userAuth');
    if (!userAuth) throw new ConflictError(); // Something is wrong
    const nonce = userAuth.metamaskNonce;
    if (!nonce) throw new BadRequestError(); // Generate nonce first

    // Elliptic curve signature verification of the signature
    const msg = getSignMessage(nonce);
    const msgBuffer = ethUtil.toBuffer(msg);
    const msgHash = ethUtil.hashPersonalMessage(msgBuffer);
    const signatureParams = ethUtil.fromRpcSig(signature);
    const publicKey = ethUtil.ecrecover(
      msgHash,
      signatureParams.v,
      signatureParams.r,
      signatureParams.s
    );
    const addressBuffer = ethUtil.publicToAddress(publicKey);
    const address = ethUtil.bufferToHex(addressBuffer);

    // Check if the public addresses match
    if (address.toLowerCase() === metamaskWallet.toLowerCase()) {
      // If they do, the signature is valid
      const newTokens = await sigmateLogin(user);
      const response: AuthResponse = {
        success: true,
        user: userToJSON(user),
        accessToken:
          newTokens.sigmateAccessToken || userAuth.sigmateAccessToken,
        refreshToken:
          newTokens.sigmateRefreshToken || userAuth.sigmateRefreshToken,
      };

      res.status(200).json(response);
    } else {
      // If they don't, the signature is invalid
      throw new UnauthenticatedError();
    }
  } catch (error) {
    next(error);
  }
};
