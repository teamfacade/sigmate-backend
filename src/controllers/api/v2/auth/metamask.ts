import { RequestHandler } from 'express';
import MetamaskAuth from '../../../../services/auth/Metamask';
import { UserResponse } from '../../../../services/auth/User';

const getNonce: RequestHandler<
  any,
  { nonce: string },
  { walletAddress: string }
> = async (req, res, next) => {
  try {
    const metamask = new MetamaskAuth();
    const nonce = await metamask.getNonce({
      metamask: { walletAddress: req.body.walletAddress },
    });
    res.status(200).json({ nonce });
  } catch (err) {
    next(err);
  }
};

const verify: RequestHandler<
  any,
  { user: UserResponse | null; accessToken: string; refreshToken: string },
  { walletAddress: string; signature: string }
> = async (req, res, next) => {
  try {
    const metamask = new MetamaskAuth();
    const { user, accessToken, refreshToken } = await metamask.authenticate({
      metamask: {
        walletAddress: req.body.walletAddress,
        signature: req.body.signature,
      },
    });

    await user.reload({ scope: 'my' });

    res.status(200).json({
      user: user.toResponse({ type: 'MY' }),
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

const metamaskControllers: Record<string, RequestHandler> = {
  getNonce,
  verify,
};

export default metamaskControllers;
