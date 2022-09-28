import { query } from 'express-validator';

export const validateGetAllAnnouncements = [
  query('cid').trim().stripLow().isInt().withMessage('NOT_INT').toInt(),
];
