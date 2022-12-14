import {
  AllowNull,
  BelongsToMany,
  Column,
  DataType,
  Default,
  HasMany,
  Length,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import GroupPolicy from './GroupPolicy.model';
import PointPolicy from './PointPolicy.model';
import PrivilegePolicy from './PrivilegePolicy.model';
import User from './User.model';
import UserGroup from './UserGroup.model';
import UserPenalty from './UserPenalty.model';

export interface PenaltyAttribs {
  id: number;
  name: string;
  description?: string;
  /**
   * Action to trigger penalty
   */
  actionName: boolean;
  /**
   * How much the penalty score is increased for each malicious activity log
   * Defaults to `1`
   */
  scoreIncrement: number;
  /**
   * Score to reach for the penalty to take effect. Defaults to `1`.
   */
  threshold: number;
  repeatable: boolean;

  /**
   * Users in these groups are exempt from the penalty policy
   */
  ignoreGroups?: UserGroup[];

  // Penalty
  /**
   * Change user's points when threshold passes
   */
  pointPolicies?: PointPolicy[];
  /**
   * PATCH a user's privilege overrides
   */
  privilegePolicies?: PrivilegePolicy[];
  /**
   * Change user's group
   */
  groupPolicies?: GroupPolicy[];

  users?: User[];

  createdAt: Date;
  updatedAt: Date;
  /**
   * Deleted penalties no longer take effect.
   * `UserPenalty` entries should be cleared on soft destroy.
   * `ON DELETE RESTRICT` needs to be set on point logs.
   */
  deletedAt?: Date;
}

type PenaltyCAttribs = Optional<
  PenaltyAttribs,
  'id' | 'scoreIncrement' | 'threshold' | 'createdAt' | 'updatedAt'
>;

@Table({
  modelName: 'Penalty',
  tableName: 'penalties',
  timestamps: true,
  underscored: true,
  paranoid: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class Penalty extends Model<PenaltyAttribs, PenaltyCAttribs> {
  @AllowNull(false)
  @Column(DataType.STRING(191))
  name!: PenaltyAttribs['name'];

  @Column(DataType.STRING)
  description: PenaltyAttribs['description'];

  @Length({ min: 1, max: 191 })
  @AllowNull(false)
  @Column(DataType.STRING(191))
  actionName!: PenaltyAttribs['actionName'];

  @Default(1)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  scoreIncrement!: PenaltyAttribs['scoreIncrement'];

  @Default(3)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  threshold!: PenaltyAttribs['threshold'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  repeatable!: PenaltyAttribs['repeatable'];

  @BelongsToMany(() => UserGroup, {
    through: 'penalty_ignored_groups',
    foreignKey: 'penaltyId',
    otherKey: 'userGroupId',
    as: 'ignoredGroups',
  })
  ignoredGroups: PenaltyAttribs['ignoreGroups'];

  @HasMany(() => PointPolicy, { foreignKey: 'penaltyId' })
  pointPolicies: PenaltyAttribs['pointPolicies'];

  @HasMany(() => PrivilegePolicy, { foreignKey: 'penaltyId' })
  privilegePolicies: PenaltyAttribs['privilegePolicies'];

  @HasMany(() => GroupPolicy, { foreignKey: 'penaltyId' })
  groupPolicies: PenaltyAttribs['groupPolicies'];

  @BelongsToMany(() => User, {
    through: () => UserPenalty,
    foreignKey: 'penaltyId',
    otherKey: 'userId',
    as: 'users',
  })
  users: PenaltyAttribs['users'];
}
