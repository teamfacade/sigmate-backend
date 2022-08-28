import {
  Model,
  DataType,
  Column,
  BelongsTo,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import Require from '../types/Require';
import Image from './Image';
import User from './User';

export type ProfileIdType = number;
export const profileIdDataType = DataType.INTEGER;

export interface UserProfileAttributes {
  id: ProfileIdType;
  user: User;
  displayName?: string;
  bio?: string;
  profileImage?: Image;
}

export type UserProfileCreationAttributes = Optional<
  UserProfileAttributes,
  'id'
>;

export type UserProfileDTO = Partial<UserProfileAttributes>;
export type UserProfileCreationDTO = Require<UserProfileDTO, 'id'>;

@Table({
  tableName: 'user_profiles',
  modelName: 'UserProfile',
  timestamps: true,
  underscored: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class UserProfile extends Model<
  UserProfileAttributes,
  UserProfileCreationAttributes
> {
  @BelongsTo(() => User, 'primaryProfileId')
  user!: UserProfileAttributes['user'];

  @Column(DataType.STRING(191))
  displayName: UserProfileAttributes['displayName'];

  @Column(DataType.TEXT)
  bio: UserProfileAttributes['bio'];

  @BelongsTo(() => Image, 'profileImageId')
  profileImage: UserProfileAttributes['profileImage'];
}
