import { Request, Response, NextFunction } from 'express';
import { userPublicInfoToJSON, userToJSON } from '.';
import { UserPublicResponse, UserResponse } from '../../models/User';
import BadRequestError from '../../utils/errors/BadRequestError';
import ConflictError from '../../utils/errors/ConflictError';
import UnauthenticatedError from '../../utils/errors/UnauthenticatedError';
import { verifySignature } from '../auth/metamask';
import { renewMetaMaskNonce } from '../database/auth';
import {
  findUserByMetamaskWallet,
  getMetaMaskNonce,
  updateUser,
} from '../database/user';

// Connecting external services, wallets, etc

type GetMetaMaskNonceSuccessResponse = {
  success: true;
  metamaskWallet: string;
  nonce: number;
};

type GetMetaMaskNonceFailResponse = {
  success: false;
  msg: string;
  user?: UserPublicResponse | null;
};

export const getMetaMaskNonceController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user;
    if (!user) throw new UnauthenticatedError();
    const metamaskWallet = req.query.metamaskWallet as string;

    // Check if this is already my wallet address
    if (user.metamaskWallet === metamaskWallet) {
      const response: GetMetaMaskNonceFailResponse = {
        success: false,
        msg: 'ERR_METAMASK_ALREADY_MY_ADDRESS',
      };
      res.status(409).json(response);
      return;
    }

    // Check if user with given wallet address already exists
    const alreadyExists = await findUserByMetamaskWallet(metamaskWallet);

    if (alreadyExists) {
      // User with given wallet address already exists. Stop.

      // If this user set their MetaMask wallet address to public,
      // contain this user's public information in response
      let ur: UserPublicResponse | null = null;
      if (alreadyExists.isMetamaskWalletPublic) {
        ur = await userPublicInfoToJSON(alreadyExists);
      }

      const response: GetMetaMaskNonceFailResponse = {
        success: false,
        msg: 'ERR_METAMASK_ALREADY_EXISTS',
        user: ur,
      };
      res.status(409).json(response);
      return;
    }

    // If we reached this far, we can start connecting
    // generate and return a random one-time nonce.
    const nonce = await getMetaMaskNonce(user);
    const response: GetMetaMaskNonceSuccessResponse = {
      success: true,
      metamaskWallet,
      nonce,
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

type ConnectMetaMaskRequestBody = {
  metamaskWallet: string;
  signature: string;
};

type ConnectMetaMaskFailResponse = {
  success: false;
  metamaskWallet: string;
  msg: string;
};

type ConnectMetaMaskSuccessResponse = {
  success: true;
  metamaskWallet: string;
  user: UserResponse;
};

export const connectMetaMaskController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { metamaskWallet, signature } =
      req.body as ConnectMetaMaskRequestBody;
    const user = req.user;
    if (!user) throw new UnauthenticatedError();

    // Check if it is my wallet address already
    if (metamaskWallet === user.metamaskWallet) {
      // Already my wallet address. No need to connect again. Stop.
      const response: ConnectMetaMaskFailResponse = {
        success: false,
        metamaskWallet,
        msg: 'ERR_METAMASK_ALREADY_MY_ADDRESS',
      };
      res.status(409).json(response);
      return;
    }

    // Check if user with given wallet address already exists
    const alreadyExists = await findUserByMetamaskWallet(metamaskWallet);
    if (alreadyExists) {
      // User with given wallet address already exists. Stop.

      // If this user set their MetaMask wallet address to public,
      // contain this user's public information in response
      const response: ConnectMetaMaskFailResponse = {
        success: false,
        metamaskWallet,
        msg: 'ERR_METAMASK_ALREADY_EXISTS',
      };
      res.status(409).json(response);
      return;
    }

    // If we reached here, we passed all tests. Start connecting
    const userAuth = await user.$get('userAuth');
    if (!userAuth) throw new ConflictError(); // Something is wrong
    const nonce = userAuth.metamaskNonce;
    if (!nonce) throw new BadRequestError(); // Generate nonce first

    // Verify signature
    const isSignatureVerified = verifySignature(
      metamaskWallet,
      nonce,
      signature
    );

    // Generate new nonce
    const rp = renewMetaMaskNonce(user);

    if (isSignatureVerified) {
      // Signature valid. Update user information
      const u = await updateUser(user, { metamaskWallet });
      const response: ConnectMetaMaskSuccessResponse = {
        success: true,
        metamaskWallet,
        user: userToJSON(u),
      };
      res.status(200).json(response);
    } else {
      // Signature invalid.
      const response: ConnectMetaMaskFailResponse = {
        success: false,
        msg: 'ERR_METAMASK_SIGNATURE_INVALID',
        metamaskWallet,
      };
      res.status(401).json(response);
    }

    // Wait for all promises to finish
    await rp;
  } catch (error) {
    next(error);
  }
};
