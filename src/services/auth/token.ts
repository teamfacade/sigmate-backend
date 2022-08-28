import jwt from 'jsonwebtoken';
import fs from 'fs';
import { UserIdType } from '../../models/User';

export const JWT_ALG = 'ES256';
export const JWT_ISS = 'sigmate.io';
export const JWT_EXP_ACCESS = '1h';
export const JWT_EXP_REFRESH = '30d';
export const JWT_TYP_ACCESS = 'acc';
export const JWT_TYP_REFRESH = 'ref';

const getECPrivateKey = () => {
  return fs.readFileSync('keys/private-key.pem');
};

export const getECPublicKey = () => {
  return fs.readFileSync('keys/cert.pem');
};

export interface SigmateJwtPayload extends jwt.JwtPayload {
  tok?: string;
  group?: string;
  isAdmin?: string;
}

/**
 * Generates a new Sigmate access token
 * @param userId Id of the user
 * @param group Group of the user
 * @param isAdmin Whether user is an admin
 * @returns New access token (JWT)
 */
export const createAccessToken = (
  userId: UserIdType,
  group: string,
  isAdmin: boolean
) => {
  return jwt.sign({ tok: JWT_TYP_ACCESS, group, isAdmin }, getECPrivateKey(), {
    issuer: JWT_ISS,
    algorithm: JWT_ALG,
    subject: userId.toString(),
    expiresIn: JWT_EXP_ACCESS,
  });
};

/**
 * Generates a new Sigmate refresh token
 * @param userId Id of the user
 * @param group Group of the user
 * @param isAdmin Whether user is an admin
 * @returns New refresh token
 */
export const createRefreshToken = (
  userId: UserIdType,
  group: string,
  isAdmin: boolean
) => {
  return jwt.sign({ tok: JWT_TYP_REFRESH, group, isAdmin }, getECPrivateKey(), {
    issuer: JWT_ISS,
    algorithm: JWT_ALG,
    subject: userId.toString(),
    expiresIn: JWT_EXP_REFRESH,
  });
};
