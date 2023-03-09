import { body } from 'express-validator';

export default class AuthValidator {
  public static authGoogle = body('code')
    .trim()
    .stripLow()
    .notEmpty()
    .isString();
}
