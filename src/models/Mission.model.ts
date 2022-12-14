import PointPolicy from './PointPolicy.model';
import {
  AllowNull,
  BelongsToMany,
  Column,
  DataType,
  Default,
  HasMany,
  Length,
  Min,
  Model,
  Table,
} from 'sequelize-typescript';
import MissionRequirement from './MissionRequirement.model';
import UserGroup from './UserGroup.model';
import User from './User.model';
import UserMission from './UserMission.model';
import GroupPolicy from './GroupPolicy.model';
import PrivilegePolicy from './PrivilegePolicy.model';

export interface MissionAttribs {
  id: number;
  name: string;
  description?: string;
  /**
   * Action to trigger mission progress
   */
  actionName: string;
  /**
   * How much the score is increased for each mission progress. Defaults to `1`
   */
  scoreIncrement: number;
  /**
   * When set, scores will change by `scoreIncrement + scoreWeight * metric`
   */
  scoreWeight?: number;
  /**
   * Maximum score that a user can accumulate on this mission
   */
  scoreLimit?: number;

  /**
   * Score to reach for the mission to be marked as completed. Defaults to `1`.
   * Set to 0 for infinity.
   */
  scoreObjective: number;

  /**
   * The mission ends for all users after the first N users complete it
   */
  limitUserCount?: number;

  /**
   * Missions can only be progressed after this date
   */
  startsAt: Date;
  /**
   * Missions need to be completed before this date
   */
  endsAt?: Date;

  // Requirements
  /**
   * Clear these missions first
   */
  requiredMissions?: Mission[];
  /**
   * Only users of this group can participate
   */
  requiredGroups?: UserGroup[];

  /**
   * Only users higher than a certain tier can participate
   */
  requiredUserTierMin?: number;
  /**
   * Only users lower than a certain tier can participate
   */
  requiredUserTierMax?: number;

  // onClear: Rewards
  /**
   * UPDATE user's points when completed
   */
  pointPolicies?: PointPolicy[];
  /**
   * UPDATE a user's privilege overrides
   */
  privilegePolicies?: PrivilegePolicy[];
  /**
   * UPDATE the group of the user who completes the mission
   */
  groupPolicies?: GroupPolicy[];

  users?: User[];

  createdAt: Date;
  updatedAt: Date;
  /**
   * Deleted missions.
   * `UserMission` entries should be cleared on soft destroy.
   * `ON DELETE RESTRICT` needs to be set on point logs.
   */
  deletedAt?: Date;
}

@Table({
  modelName: 'Mission',
  tableName: 'missions',
  timestamps: true,
  underscored: true,
  paranoid: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class Mission extends Model<MissionAttribs> {
  @AllowNull(false)
  @Column(DataType.STRING(191))
  name!: MissionAttribs['name'];

  @Column(DataType.STRING)
  description: MissionAttribs['description'];

  @Length({ min: 1, max: 191 })
  @AllowNull(false)
  @Column(DataType.STRING(191))
  actionName!: MissionAttribs['actionName'];

  @Default(1)
  @AllowNull(false)
  @Min(0)
  @Column(DataType.INTEGER)
  scoreIncrement!: MissionAttribs['scoreIncrement'];

  @Column(DataType.INTEGER)
  scoreWeight: MissionAttribs['scoreWeight'];

  @Column(DataType.INTEGER)
  scoreLimit: MissionAttribs['scoreLimit'];

  @Default(1)
  @AllowNull(false)
  @Min(0)
  @Column(DataType.INTEGER)
  scoreObjective!: MissionAttribs['scoreObjective'];

  @Column(DataType.INTEGER)
  limitUserCount: MissionAttribs['limitUserCount'];

  @Default(DataType.NOW)
  @AllowNull(false)
  @Column(DataType.DATE)
  startsAt!: MissionAttribs['startsAt'];

  @Column(DataType.DATE)
  endsAt: MissionAttribs['endsAt'];

  @BelongsToMany(() => Mission, {
    through: () => MissionRequirement,
    foreignKey: 'missionId',
    otherKey: 'requiredId',
    as: 'requiredMissions',
  })
  requiredMissions: MissionAttribs['requiredMissions'];

  @BelongsToMany(() => UserGroup, {
    through: 'mission_required_groups',
    foreignKey: 'missionId',
    otherKey: 'userGroupId',
    as: 'requiredGroups',
  })
  requiredGroups: MissionAttribs['requiredGroups'];

  @Column(DataType.INTEGER)
  requiredUserTierMin: MissionAttribs['requiredUserTierMin'];

  @Column(DataType.INTEGER)
  requiredUserTierMax: MissionAttribs['requiredUserTierMax'];

  @HasMany(() => PointPolicy, { foreignKey: 'missionId' })
  pointPolicies: MissionAttribs['pointPolicies'];

  @HasMany(() => PrivilegePolicy, { foreignKey: 'missionId' })
  privilegePolicies: MissionAttribs['privilegePolicies'];

  @HasMany(() => GroupPolicy, { foreignKey: 'missionId' })
  groupPolicies: MissionAttribs['groupPolicies'];

  @BelongsToMany(() => User, {
    through: () => UserMission,
    foreignKey: 'missionId',
    otherKey: 'userId',
    as: 'users',
  })
  users: MissionAttribs['users'];
}
