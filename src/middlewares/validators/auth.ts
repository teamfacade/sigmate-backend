import { body, query } from 'express-validator';
import { RequestValidator, ValidatorFactory } from '.';

export default class AuthValidator {
  private static metamaskWallet: ValidatorFactory = (chain) =>
    chain
      .trim()
      .stripLow()
      .notEmpty()
      .withMessage('REQUIRED')
      .isString()
      .bail()
      .isEthereumAddress()
      .withMessage('INVALID_ETH_ADDR');

  @RequestValidator
  public static authGoogle = body('code')
    .trim()
    .stripLow()
    .notEmpty()
    .isString();

  @RequestValidator
  public static renewAccess = body('refreshToken')
    .trim()
    .stripLow()
    .notEmpty()
    .isString()
    .isJWT();

  @RequestValidator
  public static getMetamaskNonce = this.metamaskWallet(query('metamaskWallet'));

  @RequestValidator
  public static authMetamask = [
    this.metamaskWallet(body('metamaskWallet')),
    body('signature')
      .trim()
      .stripLow()
      .notEmpty()
      .withMessage('REQUIRED')
      .isString()
      .bail(),
  ];
}
