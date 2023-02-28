import {
  BelongsTo,
  Column,
  DataType,
  Length,
  Model,
  Table,
  Scopes,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import User, { UserId } from './User.model';

export interface AuthAttribs {
  id: number;
  user?: User;
  userId?: UserId;
  accessTokenNonce?: string;
  refreshTokenNonce?: string;
  googleRefreshToken?: string | null;
  metamaskNonce?: string | null;
  metamaskNonceGeneratedAt?: Date | null;
}

type AuthCAttribs = Optional<AuthAttribs, 'id'>;

@Scopes(() => ({
  token: {
    attributes: ['id', 'accessTokenNonce', 'refreshTokenNonce'],
  },
  google: {
    attributes: [
      'id',
      'accessTokenNonce',
      'refreshTokenNonce',
      'googleRefreshToken',
    ],
  },
  metamask: {
    attributes: [
      'id',
      'accessTokenNonce',
      'refreshTokenNonce',
      'metamaskNonce',
      'metamaskNonceGeneratedAt',
    ],
  },
}))
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

  @Length({ max: 64 })
  @Column(DataType.STRING(64))
  accessTokenNonce: AuthAttribs['accessTokenNonce'];

  @Length({ max: 64 })
  @Column(DataType.STRING(64))
  refreshTokenNonce: AuthAttribs['refreshTokenNonce'];

  @Column(DataType.STRING(256))
  googleRefreshToken: AuthAttribs['googleRefreshToken'];

  @Column(DataType.STRING(256))
  metamaskNonce: AuthAttribs['metamaskNonce'];

  @Column(DataType.DATE(6))
  metamaskNonceGeneratedAt: AuthAttribs['metamaskNonceGeneratedAt'];
}
