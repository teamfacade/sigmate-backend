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
import User from '../../models/User.model';
import { ActionArgs, ActionMethod } from '../../utils/action';
import { account } from '../account';

export default class MetamaskAuthService extends AuthService {
  private static NONCE_EXPIRY: DurationLike = { minutes: 5 };

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
          // Generate a new nonce
          const nonce = await this.generateMetamaskNonce();

          if (!user) {
            // New user. Create an entry in the database
            user = await account.create({
              metamask: {
                wallet: wallet,
                nonce,
                isMetamaskPublic: true,
              },
              parentAction: action,
            });
          }

          if (!user) {
            throw new MetamaskAuthError('AUTH/METAMASK/NF_USER');
          }
          const auth = user.auth;
          if (!auth) throw new AuthError('AUTH/NF_AUTH');

          // Store the new nonce to the database
          auth.set('metamaskNonce', nonce);
          auth.set('metamaskNonceCreatedAt', DateTime.now().toJSDate());
          await auth.save({ transaction });
        } else {
          // Step 2. User authenticates by supplying both the wallet address and nonce
          if (!user) {
            throw new MetamaskAuthError('AUTH/METAMASK/NF_USER');
          }
          const auth = user.auth;
          if (!auth) throw new AuthError('AUTH/NF_AUTH');
          try {
            if (!auth.metamaskNonce || !auth.metamaskNonceCreatedAt) {
              throw new MetamaskAuthError('AUTH/METAMASK/NF_NONCE');
            }

            const nonceCreatedAt = DateTime.fromJSDate(
              auth.metamaskNonceCreatedAt
            );
            const nonceExpiresAt = nonceCreatedAt.plus(
              MetamaskAuthService.NONCE_EXPIRY
            );
            if (DateTime.now() > nonceExpiresAt) {
              throw new MetamaskAuthError('AUTH/METAMASK/RJ_NONCE_EXP');
            }

            const nonce = auth.metamaskNonce;
            const isVerified = this.verifySignature(wallet, nonce, signature);

            if (!isVerified) {
              throw new MetamaskAuthError('AUTH/METAMASK/RJ_INVALID_SIGNATURE');
            }
          } catch (error) {
            user = null;

            // If auth fails, invalidate nonce immediately
            auth.set('metamaskNonce', null);
            auth.set('metamaskNonceCreatedAt', null);
            await auth.save({ transaction });

            throw error;
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

  /**
   * Generate a new random nonce for Metamask authentication.
   * @returns Nonce for Metamask auth
   */
  public generateMetamaskNonce = () => {
    return new Promise<string>((resolve, reject) => {
      crypto.randomBytes(64, (err, buf) => {
        if (err) reject(err);
        else resolve(buf.toString('hex'));
      });
    });
  };

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
