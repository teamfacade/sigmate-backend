import {
  Table,
  Column,
  Model,
  DataType,
  BelongsTo,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import User from './User.model';

export interface UserAuthAttribs {
  id: number;
  user?: User;
  accessNonce?: string | null;
  refreshNonce?: string | null;
  googleRefreshToken?: string | null;
  metamaskNonce?: string | null;
  metamaskNonceCreatedAt?: Date | null;
}

type UserAuthCAttribs = Optional<UserAuthAttribs, 'id'>;

@Table({
  modelName: 'UserAuth',
  tableName: 'user_auths',
  timestamps: false,
  underscored: true,
  paranoid: false,
})
export default class UserAuth extends Model<UserAuthAttribs, UserAuthCAttribs> {
  @BelongsTo(() => User, {
    foreignKey: 'userId',
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  user: UserAuthAttribs['user'];

  @Column(DataType.STRING(32))
  accessNonce: UserAuthAttribs['accessNonce'];

  @Column(DataType.STRING(32))
  refreshNonce: UserAuthAttribs['refreshNonce'];

  @Column(DataType.STRING(255))
  googleRefreshToken: UserAuthAttribs['googleRefreshToken'];

  @Column(DataType.STRING(128))
  metamaskNonce: UserAuthAttribs['metamaskNonce'];

  @Column(DataType.DATE(6))
  metamaskNonceCreatedAt: UserAuthAttribs['metamaskNonceCreatedAt'];
}
