import { NextFunction, Request, Response } from 'express';
import _ from 'lodash';

const pickModelProperties = (model: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    req.body = _.pick(req.body, _.keys(model.getAttributes()));
    next();
  };
};

export default pickModelProperties;
