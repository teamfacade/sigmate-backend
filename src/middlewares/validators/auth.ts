import { body, query } from 'express-validator';

export const validateGoogleAuthCode = body('code')
  .trim()
  .stripLow()
  .notEmpty()
  .withMessage('ERR_OAUTH_GOOGLE')
  .bail()
  .isLength({ max: 128 })
  .withMessage('ERR_OAUTH_GOOGLE');

export const validateRenewAccessToken = body('refreshToken')
  .trim()
  .stripLow()
  .notEmpty()
  .withMessage('REQUIRED')
  .bail()
  .isLength({ max: 512 })
  .withMessage('INVALID');

export const validateGetUserByMetaMaskWallet = query('metamaskWallet')
  .trim()
  .stripLow()
  .notEmpty()
  .withMessage('REQUIRED')
  .bail()
  .isEthereumAddress()
  .withMessage('INVALID_ETH_ADDR');

export const validateMetaMaskAuth = [
  body('metamaskWallet')
    .trim()
    .stripLow()
    .notEmpty()
    .withMessage('REQUIRED')
    .bail()
    .isEthereumAddress()
    .withMessage('INVALID_ETH_ADDR'),
  body('signature').trim().stripLow().notEmpty().withMessage('REQUIRED').bail(),
];
