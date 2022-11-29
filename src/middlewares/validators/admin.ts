import { body } from 'express-validator';

export const validateConfirm = [
  body('collectionId')
    .trim()
    .stripLow()
    .notEmpty()
    .withMessage('REQUIRED')
    .isInt()
    .withMessage('NOT_INT')
    .toInt(),
  body('discordAccountId').notEmpty().withMessage('REQUIRED').toInt(),
  body('discordUrl')
    .optional()
    .trim()
    .stripLow()
    .isURL({
      require_host: true,
      protocols: ['https'],
      require_valid_protocol: true,
      allow_fragments: false,
      allow_query_components: false,
      host_whitelist: ['discord.gg', 'discord.invite'],
    })
    .withMessage('NOT_URL'),
  body('discordChannel')
    .optional({ checkFalsy: true })
    .trim()
    .stripLow()
    .isNumeric()
    .withMessage('NOT_NUMERIC'),
  body('twitterHandle')
    .optional()
    .trim()
    .stripLow()
    .isAlphanumeric('en-US', { ignore: '_' })
    .withMessage('NOT_ALPHANUMERIC')
    .isLength({ max: 15 })
    .withMessage('TOO_LONG'),
];
