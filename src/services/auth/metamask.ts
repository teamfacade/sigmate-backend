import crypto from 'crypto';
import {
  toBuffer,
  hashPersonalMessage,
  fromRpcSig,
  ecrecover,
  publicToAddress,
  bufferToHex,
} from 'ethereumjs-util';
import { DateTime, DurationLike } from 'luxon';
import AuthService, { AuthenticateDTO } from '.';
import AuthError from '../../errors/auth';
import MetamaskAuthError from '../../errors/auth/metamask';
import { User } from '../../models/User.model';
import { UserAuth } from '../../models/UserAuth.model';
import { ActionArgs, ActionMethod } from '../../utils/action';
import { account } from '../account';

export default class MetamaskAuthService extends AuthService {
  private static NONCE_EXPIRY: DurationLike = { minutes: 5 };
  private static INTERVAL_METAMASK_CHANGE: DurationLike = { weeks: 2 };
  private static GRACE_METAMASK_CHANGE: DurationLike = { minutes: 3 };

  constructor() {
    super('MetamaskAuth');
  }

  @ActionMethod('AUTH/METAMASK/AUTH')
  public async authenticate(args: AuthenticateDTO & ActionArgs) {
    const { metamask, action, transaction, req } = args;
    try {
      let user: User | null;
      if (metamask) {
        const { wallet, signature } = metamask;

        // Look for the user
        if (wallet) {
          user = await User.findOne({
            where: { metamaskWallet: wallet },
            ...User.FIND_OPTS.my,
            transaction,
          });
        } else {
          // A wallet address must always be present
          throw new MetamaskAuthError('AUTH/METAMASK/NF_WALLET');
        }

        if (!signature) {
          // Step 1. User requests nonce by supplying wallet address
          if (!user) {
            // New user. Create an entry in the database
            user = await account.create({
              metamask: {
                wallet: wallet,
                isMetamaskPublic: true,
              },
              parentAction: action,
            });
          }

          // If user is not found, something went wrong
          if (!user) {
            throw new MetamaskAuthError('AUTH/METAMASK/NF_USER');
          }
          const auth = user.auth;
          if (!auth) throw new AuthError('AUTH/NF_AUTH');

          // Generate a new nonce
          await this.generateMetamaskNonce({ auth, parentAction: action });
        } else {
          // Step 2. User authenticates by supplying both the wallet address and nonce
          if (!user) {
            throw new MetamaskAuthError('AUTH/METAMASK/NF_USER');
          }
          const auth = user.auth;
          if (!auth) throw new AuthError('AUTH/NF_AUTH');

          try {
            this.verifyNonce(user, wallet, signature);
            user.set('metamaskUpdatedAt', DateTime.now().toJSDate());
            user.set('isMetamaskVerified', true);
            await user.save({ transaction });
          } catch (error) {
            user = null;
            throw error;
          } finally {
            // If auth fails, invalidate nonce immediately
            if (auth.metamaskNonce || auth.metamaskNonceCreatedAt) {
              auth.set('metamaskNonce', null);
              auth.set('metamaskNonceCreatedAt', null);
              await auth.save({ transaction });
            }
          }
        }
      } else {
        user = null;
      }
      if (req && user) req.user = user;
      return user;
    } catch (error) {
      throw new AuthError({ code: 'AUTH/RJ_UNAUTHENTICATED', error });
    }
  }

  @ActionMethod('AUTH/METAMASK/CONNECT')
  public async connect(
    args: { user: User } & AuthenticateDTO['metamask'] & ActionArgs
  ) {
    const { user, wallet, signature, transaction, action } = args;
    if (wallet) {
      const alreadyExists = await User.findOne({
        where: { metamaskWallet: wallet },
        ...User.FIND_OPTS.exists,
        transaction,
      });
      if (alreadyExists) {
        if (user.id === alreadyExists.id) {
          throw new MetamaskAuthError('AUTH/METAMASK/CF_WALLET_ALREADY_MINE');
        } else {
          throw new MetamaskAuthError('AUTH/METAMASK/CF_WALLET_NOT_MINE');
        }
      }
    }

    this.checkMetamaskChangeInterval(user);

    const auth = user.auth;
    if (!auth) throw new AuthError('AUTH/NF_AUTH');

    if (!signature) {
      // Step 1. Generate a nonce, save it to the DB, and send to user
      const now = DateTime.now();

      user.set('metamaskWallet', wallet);
      user.set('metamaskUpdatedAt', now.toJSDate());
      user.set('isMetamaskVerified', false);
      await user.save({ transaction });
      await this.generateMetamaskNonce({ auth, parentAction: action });
    } else {
      // Step 2: Verify the signed message
      try {
        // Provided wallet address must match the one given on the first step
        this.verifyNonce(user, wallet, signature);
        await this.onVerify({ user, wallet, parentAction: action });
      } catch (error) {
        await this.onVerifyFail({ user, parentAction: action });
      }
    }

    return auth;
  }

  @ActionMethod('AUTH/METAMASK/DISCONNECT')
  public async disconnect(args: { user: User } & ActionArgs) {
    const { user, transaction } = args;
    if (!user.metamaskWallet) {
      throw new MetamaskAuthError('AUTH/METAMASK/CF_NOT_CONNECTED');
    }
    this.checkMetamaskChangeInterval(user);

    user.set('metamaskWallet', null);
    user.set('metamaskUpdatedAt', DateTime.now().toJSDate());
    user.set('isMetamaskVerified', null);
    user.set('isMetamaskPublic', null);

    await user.save({ transaction });
  }

  /**
   * Step 2. Verify a signature sent by the user
   * @param user User to verify
   * @param wallet Wallet address that came from the request
   * @param signature Signed message to verify
   * @param throws Set to true to throw an error on failure. Returns a boolean when set to false
   */
  private verifyNonce(
    user: User,
    wallet: string,
    signature: string,
    throws = true
  ) {
    try {
      // Check if wallet address on the second step matches the first step
      if (user.metamaskWallet !== wallet) {
        throw new MetamaskAuthError('AUTH/METAMASK/RJ_ADDRESS_MISMATCH');
      }

      const auth = user.auth;
      if (!auth) throw new AuthError('AUTH/NF_AUTH');

      // Check if nonce has been generated
      if (!auth.metamaskNonce || !auth.metamaskNonceCreatedAt) {
        throw new MetamaskAuthError('AUTH/METAMASK/NF_NONCE');
      }

      // Check if that nonce has expired
      const nonceCreatedAt = DateTime.fromJSDate(auth.metamaskNonceCreatedAt);
      const nonceExpiresAt = nonceCreatedAt.plus(
        MetamaskAuthService.NONCE_EXPIRY
      );
      const now = DateTime.now();
      if (now > nonceExpiresAt) {
        throw new MetamaskAuthError('AUTH/METAMASK/RJ_NONCE_EXP');
      }

      // Verify the signed message using the nonce from DB, and signature from request
      const nonce = auth.metamaskNonce;
      const isVerified = this.verifySignature(wallet, nonce, signature);
      if (!isVerified) {
        throw new MetamaskAuthError('AUTH/METAMASK/RJ_INVALID_SIGNATURE');
      }
      return true;
    } catch (error) {
      if (throws) throw error;
      else return false;
    }
  }

  @ActionMethod('AUTH/METAMASK/ON_VERIFY')
  private async onVerify(args: { user: User; wallet: string } & ActionArgs) {
    const { user, wallet, transaction } = args;
    const auth = user.auth;
    if (!auth) throw new AuthError('AUTH/NF_AUTH');

    user.set('metamaskWallet', wallet);
    user.set('metamaskUpdatedAt', DateTime.now().toJSDate());
    user.set('isMetamaskVerified', true);
    auth.set('metamaskNonce', null);
    auth.set('metamaskNonceCreatedAt', null);
    await user.save({ transaction });
    await auth.save({ transaction });
  }

  @ActionMethod('AUTH/METAMASK/ON_VERIFY_FAIL')
  private async onVerifyFail(args: { user: User } & ActionArgs) {
    const { user, transaction } = args;
    const auth = user.auth;
    if (!auth) throw new AuthError('AUTH/NF_AUTH');
    if (auth.metamaskNonce || auth.metamaskNonceCreatedAt) {
      auth.set('metamaskNonce', null);
      auth.set('metamaskNonceCreatedAt', null);
      await auth.save({ transaction });
    }
  }

  private checkMetamaskChangeInterval(user: User) {
    const now = DateTime.now();

    if (user.metamaskUpdatedAt && user.isMetamaskVerified) {
      const updatedAt = DateTime.fromJSDate(user.metamaskUpdatedAt);
      // Users cannot change wallets too often (prevent fraud)
      const canChangeFrom = updatedAt.plus(
        MetamaskAuthService.INTERVAL_METAMASK_CHANGE
      );
      // Allow a grace period to fix any mistakes
      const gracePeriod = updatedAt.plus(
        MetamaskAuthService.GRACE_METAMASK_CHANGE
      );
      if (now > gracePeriod && now < canChangeFrom) {
        throw new MetamaskAuthError('AUTH/METAMASK/RJ_CHANGE_INTERVAL');
      }
    }
  }

  @ActionMethod('AUTH/METAMASK/GEN_NONCE')
  private async generateMetamaskNonce(args: { auth: UserAuth } & ActionArgs) {
    const { auth, transaction } = args;
    const nonce = await this.__generateMetamaskNonce();
    auth.set('metamaskNonce', nonce);
    auth.set('metamaskNonceCreatedAt', DateTime.now().toJSDate());
    await auth.save({ transaction });
    return nonce;
  }

  /**
   * Generate a new random nonce for Metamask authentication.
   * @returns Nonce for Metamask auth
   */
  private __generateMetamaskNonce() {
    return new Promise<string>((resolve, reject) => {
      crypto.randomBytes(64, (err, buf) => {
        if (err) reject(err);
        else resolve(buf.toString('hex'));
      });
    });
  }

  /**
   * Generate a message for the user to sign with their Metamask credentials
   * @param nonce Nonce to include in message
   * @returns Generated message to sign
   */
  private getSignMessage(nonce: string | number) {
    return 'I am signing my one-time nonce for Sigmate: ' + nonce;
  }

  /**
   * Check the signed message received from the user to cryptographically verify the signature and that the expected wallet address matches the dervied address contained in the signature
   * @param publicAddress Expected Metamask wallet address
   * @param nonce Nonce from the database
   * @param signature Signed message from the clietn
   * @returns Whether the signature is valid
   */
  private verifySignature(
    publicAddress: string,
    nonce: string | number,
    signature: string
  ) {
    // Elliptic curve signature verification of the signature
    // Derive address from signature
    const msg = this.getSignMessage(nonce);
    const msgHash = hashPersonalMessage(toBuffer(Buffer.from(msg, 'utf-8')));
    const { v, r, s } = fromRpcSig(signature);
    const publicKey = ecrecover(msgHash, v, r, s);
    const derivedPublicAddress = bufferToHex(publicToAddress(publicKey));

    // Compare it with given publicAddress
    return publicAddress.toLowerCase() === derivedPublicAddress.toLowerCase();
  }

  async start() {
    this.setStatus('AVAILABLE');
  }
}

export const metamaskAuth = new MetamaskAuthService();
