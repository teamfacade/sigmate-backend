import {
  BelongsTo,
  Column,
  DataType,
  Is,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import { MYSQL_VALIDATORS } from '../../middlewares/validators';
import User from './User.model';

export interface AuthAttribs {
  id: number;
  user?: User;
  sigmateAccessTokenIat?: number;
  sigmateRefreshTokenIat?: number;
  googleAccessToken?: string;
  googleRefreshToken?: string;
  metamaskNonce?: string;
  metamaskNonceGeneratedAt?: Date;
}

type AuthCAttribs = Optional<AuthAttribs, 'id'>;

@Table({
  modelName: 'Auth',
  tableName: 'auths',
  timestamps: false,
  underscored: true,
  paranoid: false,
})
export default class Auth extends Model<AuthAttribs, AuthCAttribs> {
  @BelongsTo(() => User, {
    foreignKey: 'userId',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  user: AuthAttribs['user'];

  @Is('mysqlint', MYSQL_VALIDATORS.INT)
  @Column(DataType.INTEGER)
  sigmateAccessTokenIat: AuthAttribs['sigmateAccessTokenIat'];

  @Is('mysqlint', MYSQL_VALIDATORS.INT)
  @Column(DataType.INTEGER)
  sigmateRefreshTokenIat: AuthAttribs['sigmateRefreshTokenIat'];

  @Column(DataType.STRING(512))
  googleAccessToken: AuthAttribs['googleAccessToken'];

  @Column(DataType.STRING(256))
  googleRefreshToken: AuthAttribs['googleRefreshToken'];

  @Column(DataType.STRING(256))
  metamaskNonce: AuthAttribs['metamaskNonce'];

  @Column(DataType.DATE(6))
  metamaskNonceGeneratedAt: AuthAttribs['metamaskNonceGeneratedAt'];
}
