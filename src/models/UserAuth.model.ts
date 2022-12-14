import {
  BelongsTo,
  Column,
  DataType,
  Model,
  Table,
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
