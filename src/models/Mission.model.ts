import PointPolicy from './PointPolicy.model';
import {
  AllowNull,
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  Default,
  HasMany,
  IsIn,
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
import Action, { ActionAttribs } from './Action.model';

export interface MissionAttribs {
  id: number;
  name: string;
  description?: string;
  /**
   * Action to trigger mission progress.
   */
  action?: Action;
  actionId?: ActionAttribs['id'];
  /**
   * Mission will only progress if action metric exceeds
   * a certain value
   */
  metricThreshold?: number;

  /**
   * How much the score is increased for each mission progress. Defaults to `1`
   */
  scoreIncrement: number;
  /**
   * When set, scores will change by
   * `scoreIncrement + scoreWeight * action metric`
   */
  scoreWeight?: number;
  /**
   * Maximum score that a user can accumulate on this mission.
   * (`scoreLimit` >= `scoreObjective`)
   */
  scoreLimit?: number;
  /**
   * Minimum score for the mission to be regarded as success.
   * (`scoreLimit` >= `scoreObjective`)
   */
  scoreObjective: number;

  /**
   * If `true`(default), mission is marked as accomplish as soon as
   * the user reaches `scoreLimit`. If `false`, mission ends at
   * the time set on `closesAt`.
   *
   * Related field(s): `rewardedUserLimit`
   */
  endOnObjective: boolean;

  /**
   * If `endOnObjective` is `true`, reward N users who accomplished first
   * If `false`, reward N users who accumulated the most points
   *
   * To define how to handle ties, see `rewardedLimitIncludeTies`.
   */
  rewardedUserLimit?: number;

  /**
   * If ties while calculating `rewardedUserLimit` exist,
   * set `true` to reward everyone (may exceed limit)
   * or set `false` to exclude ties
   * (never exceeds limit, but may exclude everyone)
   */
  rewardedLimitIncludeTies?: boolean;

  /**
   * Missions can only be progressed after this date
   */
  startsAt: Date;
  /**
   * Missions need to be accomplished before this date
   */
  closesAt?: Date | null;

  /**
   * The time when the mission actually closed (only for missions with limits)
   */
  closedAt?: Date | null;

  // Repeat
  /**
   * Set to allow users to retry this mission on certain intervals.
   * Integer larger than 1.
   */
  repeatInterval?: number | null;

  /**
   * Set the unit of `repeatInterval`. Possible values are:
   * - `m`: minutes
   * - `h`: hours
   * - `D`: days
   * - `W`: weeks
   * - `M`: months
   * - `Y`: years
   */
  repeatIntevalUnits?: string;

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
   * Minimum user tier to participate in this mission (greater than or equal)
   */
  requiredUserTierMin?: number;
  /**
   * Maximum user tier to participate in this mission (less than or equal)
   */
  requiredUserTierMax?: number;

  // onClear: Rewards
  /**
   * UPDATE user's points when accomplished
   */
  pointPolicies?: PointPolicy[];
  /**
   * UPDATE a user's privilege overrides
   */
  privilegePolicies?: PrivilegePolicy[];
  /**
   * UPDATE the group of the user who accomplishs the mission
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
  @Length({ min: 1, max: 191 })
  @AllowNull(false)
  @Column(DataType.STRING(191))
  name!: MissionAttribs['name'];

  @Length({ max: 255 })
  @Column(DataType.STRING)
  description: MissionAttribs['description'];

  @BelongsTo(() => Action, { foreignKey: 'actionId' })
  action: MissionAttribs['action'];

  @Column(DataType.INTEGER)
  metricThreshold: MissionAttribs['metricThreshold'];

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
  @Column(DataType.INTEGER)
  scoreObjective!: MissionAttribs['scoreObjective'];

  @Default(true)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  endOnObjective!: MissionAttribs['endOnObjective'];

  @Column(DataType.INTEGER)
  rewardedUserLimit: MissionAttribs['rewardedUserLimit'];

  @Column(DataType.BOOLEAN)
  rewardedLimitIncludeTies: MissionAttribs['rewardedLimitIncludeTies'];

  @Default(DataType.NOW)
  @AllowNull(false)
  @Column(DataType.DATE)
  startsAt!: MissionAttribs['startsAt'];

  @Column(DataType.DATE)
  closesAt: MissionAttribs['closesAt'];

  @Column(DataType.DATE(6))
  closedAt: MissionAttribs['closedAt'];

  @Column(DataType.INTEGER)
  repeatInterval: MissionAttribs['repeatInterval'];

  @IsIn({
    msg: 'INVALID',
    args: [['h', 'D', 'W', 'M', 'Y']],
  })
  @Column(DataType.STRING(2))
  // repeatIntervalUnits: MissionAttribs['repeatIntevalUnits'];
  get repeatIntervalUnits() {
    const v = this.getDataValue('repeatIntevalUnits');
    switch (v) {
      case 'h':
        return 'hour';
      case 'D':
        return 'day';
      case 'W':
        return 'week';
      case 'M':
        return 'month';
      case 'Y':
        return 'year';
      default:
        return undefined;
    }
  }

  set repeatIntervalUnits(value) {
    let dataValue: string | undefined = undefined;
    switch (value) {
      case 'hour':
        dataValue = 'h';
        break;
      case 'day':
        dataValue = 'D';
        break;
      case 'week':
        dataValue = 'W';
        break;
      case 'month':
        dataValue = 'M';
        break;
      case 'year':
        dataValue = 'Y';
        break;
      default:
        dataValue = undefined;
        break;
    }
    this.setDataValue('repeatIntevalUnits', dataValue);
  }

  get isRepeatable() {
    return Boolean(
      this.getDataValue('repeatInterval') &&
        this.getDataValue('repeatIntevalUnits')
    );
  }

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
  // Eager loaded UserMission through table
  UserMission?: UserMission;
}
