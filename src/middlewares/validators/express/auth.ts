import { ValidationChain } from 'express-validator';
import ExpressValidator from '.';

export default class AuthValidator extends ExpressValidator {
  static googleOAuthCode(chain: ValidationChain) {
    return chain.trim().stripLow().isString().notEmpty();
  }
}
