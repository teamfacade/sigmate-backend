import { body } from 'express-validator';
import WaitingList from '../../models/WaitingList';

export const validateAddEmailToWaitingList = [
  body('email')
    .trim()
    .stripLow()
    .notEmpty()
    .withMessage('REQUIRED')
    .isEmail()
    .withMessage('NOT_EMAIL')
    .isLength({ max: 255 })
    .withMessage('TOO_LONG')
    .bail()
    .custom(async (value) => {
      const wl = await WaitingList.findOne({ where: { email: value } });
      if (wl) {
        throw new Error('ALREADY_EXISTS');
      }
      return true;
    }),
];
