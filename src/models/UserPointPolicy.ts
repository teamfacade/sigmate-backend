import {
  AllowNull,
  Column,
  DataType,
  Length,
  Model,
  Table,
  Unique,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';

export type PolicyNames =
  | 'forumPostCreate'
  | 'forumPostCommentCreate'
  | 'referral'
  | 'wikiDocumentEdit';

export interface UserPointPolicyAttributes {
  id: number;
  name: string;
  ppa: number; // points per action
  maxActionsPerDay?: number;
  maxActionsPerTarget?: number;
  createdAt: Date;
  updatedAt: Date;
}

export type UserPointPolicyCreationAttributes = Optional<
  Omit<UserPointPolicyAttributes, 'createdAt' | 'updatedAt'>,
  'id'
>;

@Table({
  modelName: 'UserPointPolicy',
  tableName: 'user_point_policies',
  timestamps: true,
  underscored: true,
  paranoid: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class UserPointPolicy extends Model<
  UserPointPolicyAttributes,
  UserPointPolicyCreationAttributes
> {
  @Unique('point_policy_name')
  @AllowNull(false)
  @Length({ min: 1, max: 64 })
  @Column(DataType.STRING(64))
  name!: UserPointPolicyAttributes['name'];

  @Column(DataType.INTEGER)
  ppa!: UserPointPolicyAttributes['ppa'];

  @Column(DataType.INTEGER)
  maxActionsPerDay: UserPointPolicyAttributes['maxActionsPerDay'];

  @Column(DataType.INTEGER)
  maxActionsPerTarget: UserPointPolicyAttributes['maxActionsPerTarget'];
}
