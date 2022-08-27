import {
  Model,
  DataType,
  Table,
  Column,
  BelongsTo,
} from 'sequelize-typescript';
import User from './User';

export interface UserAuthAttributes {
  user: User;
  sigmateAccessToken?: string;
  sigmateRefreshToken?: string;
  googleAccessToken?: string;
  googleRefreshToken?: string;
}

export type UserAuthDTO = Partial<UserAuthAttributes>;

@Table({
  tableName: 'user_auths',
  modelName: 'UserAuth',
  underscored: true,
  timestamps: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class UserAuth extends Model<UserAuthAttributes> {
  @BelongsTo(() => User, 'userId')
  user!: UserAuthAttributes['user'];

  @Column(DataType.STRING(512))
  sigmateAccessToken: UserAuthAttributes['sigmateAccessToken'];

  @Column(DataType.STRING(512))
  sigmateRefreshToken: UserAuthAttributes['sigmateRefreshToken'];

  @Column(DataType.STRING(512))
  googleAccessToken: UserAuthAttributes['googleAccessToken'];

  @Column(DataType.STRING(512))
  googleRefreshToken: UserAuthAttributes['googleRefreshToken'];
}
