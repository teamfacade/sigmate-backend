import RequestError from '../errors/request';
import { AuthGuard } from '../middlewares/auth';
import { User } from '../models/User.model';
import { auth } from '../services/auth';
import { discordAuth } from '../services/auth/discord';
import { googleAuth } from '../services/auth/google';
import { metamaskAuth } from '../services/auth/metamask';

export default class AuthController {
  public static renewAccess: sigmate.ReqHandler<sigmate.Api.Auth.RenewAccess> =
    async (req, res, next) => {
      try {
        const { refreshToken } = req.body;
        const user = await auth.authenticate({
          token: { refresh: refreshToken },
        });
        if (user) req.user = user;
        const tokens = await auth.getTokens({ user });
        res.status(200).json({
          meta: res.meta(),
          success: true,
          ...tokens,
        });
      } catch (error) {
        next(error);
      }
    };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static getAuthUrl: sigmate.ReqHandler = (req, res, next) => {
    res.redirect(googleAuth.authorizationUrl);
  };

  public static authGoogle: sigmate.ReqHandler<sigmate.Api.Auth.Google> =
    async (req, res, next) => {
      try {
        const { code } = req.body;
        const user = await googleAuth.authenticate({ google: { code }, req });
        const tokens = await googleAuth.getTokens({
          user,
          renew: true,
          force: false,
          req,
        });
        res.status(200).json({
          meta: res.meta(),
          success: true,
          user: user.toResponse(),
          ...tokens,
        });
      } catch (error) {
        next(error);
      }
    };

  @AuthGuard({ login: 'required', findOptions: User.FIND_OPTS.my })
  public static connectGoogle: sigmate.ReqHandler<sigmate.Api.Auth.ConnectGoogle> =
    async (req, res, next) => {
      try {
        const user = req.user;
        if (!user) throw new RequestError('REQ/RJ_UNAUTHENTICATED');
        const { code } = req.body;
        await googleAuth.connect({ user, code, req });

        res.status(200).json({
          meta: res.meta(),
          success: true,
          user: user.toResponse(),
        });
      } catch (error) {
        next(error);
      }
    };

  @AuthGuard({ login: 'required', findOptions: User.FIND_OPTS.my })
  public static disconnectGoogle: sigmate.ReqHandler<sigmate.Api.Auth.DisconnectGoogle> =
    async (req, res, next) => {
      try {
        const user = req.user as NonNullable<typeof req.user>;
        await googleAuth.disconnect({ user, req });
        res.status(200).json({ meta: res.meta(), success: true });
      } catch (error) {
        next(error);
      }
    };

  public static getMetamaskNonce: sigmate.ReqHandler<sigmate.Api.Auth.GetMetamaskNonce> =
    async (req, res, next) => {
      try {
        const { metamaskWallet } = req.query;
        const user = await metamaskAuth.authenticate({
          metamask: { wallet: metamaskWallet },
        });
        if (!user) throw new Error('User not found');
        const auth = user.auth;
        if (!auth) throw new Error('Auth not found');
        const nonce = auth.metamaskNonce;
        if (!nonce) throw new Error('Nonce not found');
        res.status(200).json({
          meta: res.meta(),
          success: true,
          metamaskWallet,
          nonce,
        });
      } catch (error) {
        next(error);
      }
    };

  public static authMetamask: sigmate.ReqHandler<sigmate.Api.Auth.AuthMetamask> =
    async (req, res, next) => {
      try {
        const { metamaskWallet, signature } = req.body;
        const user = await metamaskAuth.authenticate({
          metamask: { wallet: metamaskWallet, signature },
        });
        if (!user) throw new RequestError('REQ/RJ_UNAUTHENTICATED');
        const tokens = await auth.getTokens({ user });
        res.status(200).json({
          meta: res.meta(),
          success: true,
          user: user.toResponse(),
          ...tokens,
        });
      } catch (error) {
        next(error);
      }
    };

  @AuthGuard({ login: 'required' })
  public static connectMetamaskGetNonce: sigmate.ReqHandler<sigmate.Api.Auth.GetMetamaskNonce> =
    async (req, res, next) => {
      try {
        const { metamaskWallet } = req.query;
        const user = req.user as NonNullable<typeof req.user>;
        const auth = await metamaskAuth.connect({
          user,
          wallet: metamaskWallet,
        });
        const nonce = auth.metamaskNonce;
        if (!nonce) throw new Error('Nonce generation failed');
        res.status(200).json({
          meta: res.meta(),
          success: true,
          metamaskWallet,
          nonce,
        });
      } catch (error) {
        next(error);
      }
    };

  @AuthGuard({ login: 'required' })
  public static connectMetamaskVerify: sigmate.ReqHandler<sigmate.Api.Auth.ConnectMetamaskVerify> =
    async (req, res, next) => {
      try {
        const { metamaskWallet, signature } = req.body;
        const user = req.user as NonNullable<typeof req.user>;
        await metamaskAuth.connect({
          user,
          wallet: metamaskWallet,
          signature,
        });
        res.status(200).json({
          meta: res.meta(),
          success: true,
        });
      } catch (error) {
        next(error);
      }
    };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static getDiscordAuthUrl: sigmate.ReqHandler = (req, res, next) => {
    res.redirect(discordAuth.authorizationUrl);
  };

  // discord 인증 로그인
  public static authDiscord: sigmate.ReqHandler<sigmate.Api.Auth.Discord> =
    async (req, res, next) => {
      try {
        const { code } = req.body;
        const user = await discordAuth.authenticate({ discord: { code }, req });
        const tokens = await discordAuth.getTokens({
          user,
          renew: true,
          force: false,
          req,
        });
        res.status(200).json({
          meta: res.meta(),
          success: true,
          user: user.toResponse(),
          ...tokens,
        });
      } catch (error) {
        next(error);
      }
    };

  @AuthGuard({ login: 'required', findOptions: User.FIND_OPTS.my })
  public static connectDiscord: sigmate.ReqHandler<sigmate.Api.Auth.ConnectDiscord> =
    async (req, res, next) => {
      try {
        const user = req.user;
        if (!user) throw new RequestError('REQ/RJ_UNAUTHENTICATED');
        const { code } = req.body;
        await discordAuth.connect({ user, code, req });

        res.status(200).json({
          meta: res.meta(),
          success: true,
          user: user.toResponse(),
        });
      } catch (error) {
        next(error);
      }
    };
}
