import { Query, Send } from 'express-serve-static-core';

type DefaultBody = Record<string, any>;
type DefaultParams = Record<string, string>;
type DefaultQuery = Record<string, string>;

export interface Request<
  B = DefaultBody,
  P = DefaultParams,
  Q extends Query = DefaultQuery
> extends Express.Request {
  body: B;
  params: P;
  query: Q;
}

export interface Response<B = DefaultBody> extends Express.Response {
  json: Send<B, this>;
}
