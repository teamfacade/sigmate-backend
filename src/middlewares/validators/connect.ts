import { body, query } from 'express-validator';

export const validateGetMetaMaskNonce = query('metamaskWallet')
  .trim()
  .stripLow()
  .notEmpty()
  .withMessage('REQUIRED')
  .bail()
  .isEthereumAddress()
  .withMessage('INVALID_ETH_ADDR');

export const validateConnectMetaMask = [
  body('metamaskWallet')
    .trim()
    .stripLow()
    .notEmpty()
    .withMessage('REQUIRED')
    .bail()
    .isEthereumAddress()
    .withMessage('INVALID_ETH_ADDR'),
  body('signature').trim().stripLow().notEmpty().withMessage('REQUIRED'),
];
