import { body } from 'express-validator';
import { RequestValidator } from '.';

export default class AuthValidator {
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
}
