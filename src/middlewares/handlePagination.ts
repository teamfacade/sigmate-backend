import { NextFunction, Request, Response } from 'express';
import { query } from 'express-validator';
import handleBadRequest from './handleBadRequest';

export interface PaginationOptions {
  limit: number;
  page: number;
  offset: number;
}

const validatePagination = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('NOT_INT')
    .bail()
    .toInt(),
  query('page')
    .optional()
    .isInt({ min: 1, max: 4294967295 })
    .withMessage('NOT_INT')
    .bail()
    .toInt(),
];

const pagination = (req: Request, res: Response, next: NextFunction) => {
  const limit = (req.query.limit || 50) as number;
  const page = (req.query.page || 1) as number;
  const offset = limit * (page - 1);
  req.pg = { limit, page, offset };
  next();
};

const handlePagination = [...validatePagination, handleBadRequest, pagination];

export default handlePagination;
