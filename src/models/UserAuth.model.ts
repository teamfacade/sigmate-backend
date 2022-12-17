import {
  BelongsTo,
  Column,
  DataType,
  Model,
  Table,
  Scopes,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import User from './User.model';

export interface UserAuthAttribs {
  id: number;
  user?: User;
  sigmateAccessTokenIat?: number;
  sigmateRefreshTokenIat?: number;
  googleAccessToken?: string;
  googleRefreshToken?: string;
  metamaskNonce?: string;
}

export type UserAuthCAttribs = Optional<UserAuthAttribs, 'id'>;

export const AUTH_ATTRIBS_TOKEN = [
  'id',
  'sigmateAccessTokenIat',
  'sigmateRefreshTokenIat',
];
export const AUTH_ATTRIBS_GOOGLE = [
  'id',
  'googleAccessToken',
  'googleRefreshToken',
];
export const AUTH_ATTRIBS_METAMASK = ['id', 'metamaskNonce'];

@Scopes(() => ({
  token: {
    attributes: AUTH_ATTRIBS_TOKEN,
  },
  google: {
    attributes: AUTH_ATTRIBS_GOOGLE,
  },
  metamask: {
    attributes: AUTH_ATTRIBS_METAMASK,
  },
}))
@Table({
  tableName: 'user_auths',
  modelName: 'UserAuth',
  underscored: true,
  timestamps: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class UserAuth extends Model<UserAuthAttribs, UserAuthCAttribs> {
  @BelongsTo(() => User, {
    as: 'user',
    foreignKey: 'userId',
    onDelete: 'CASCADE',
  })
  user: UserAuthAttribs['user'];

  @Column(DataType.INTEGER)
  sigmateAccessTokenIat: UserAuthAttribs['sigmateAccessTokenIat'];

  @Column(DataType.INTEGER)
  sigmateRefreshTokenIat: UserAuthAttribs['sigmateRefreshTokenIat'];

  @Column(DataType.STRING(512))
  googleAccessToken: UserAuthAttribs['googleAccessToken'];

  @Column(DataType.STRING(512))
  googleRefreshToken: UserAuthAttribs['googleRefreshToken'];

  @Column(DataType.STRING(256))
  metamaskNonce: UserAuthAttribs['metamaskNonce'];
}
