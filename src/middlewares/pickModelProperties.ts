import { NextFunction, Request, Response } from 'express';
import _ from 'lodash';

const pickModelProperties = (model: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    req.body = _.pick(req.body, _.keys(model.getAttributes()));
    if (req.body.createdAt !== undefined) delete req.body.createdAt;
    if (req.body.updatedAt !== undefined) delete req.body.updatedAt;
    if (req.body.deletedAt !== undefined) delete req.body.deletedAt;
    next();
  };
};

export default pickModelProperties;
