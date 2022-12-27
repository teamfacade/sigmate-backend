import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Default,
  Model,
  Table,
} from 'sequelize-typescript';
import Mission, { MissionAttribs } from './Mission.model';
import User, { UserId } from './User.model';

export interface UserMissionAttribs {
  user?: User;
  userId?: UserId;
  mission?: Mission;
  missionId?: MissionAttribs['id'];
  /**
   * Set false to prevent user from progressing this mission.
   * These missions will become completely invisible to users.
   */
  canProgress?: boolean;

  score: number;
  /**
   * Time at which mission either completed or failed
   */
  endedAt?: Date | null;
  /**
   * Possible Values:
   * `true`- accomplished, `false`- failed, `NULL`- not ended
   */
  accomplished?: boolean | null;
  /**
   * (Repeatable missions only)
   * The number of times a this mission has been accomplished.
   * (Must be `NULL` for non-repeatable missions)
   */
  accomplishedCount?: number | null;

  createdAt: Date;
  updatedAt: Date;
}

/**
 * Ongoing missions by users
 * Many-to-Many relationship between User and Model
 */
@Table({
  modelName: 'UserMission',
  tableName: 'user_missions',
  timestamps: true,
  underscored: true,
  paranoid: false,
})
export default class UserMission extends Model<UserMissionAttribs> {
  @BelongsTo(() => User, {
    foreignKey: 'userId',
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  user: UserMissionAttribs['user'];

  @BelongsTo(() => Mission, {
    foreignKey: 'missionId',
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  mission: UserMissionAttribs['mission'];

  @Default(0)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  score!: UserMissionAttribs['score'];

  @Default(true)
  @Column(DataType.BOOLEAN)
  canProgress: UserMissionAttribs['canProgress'];

  @Column(DataType.DATE(6))
  endedAt: UserMissionAttribs['endedAt'];

  @Column(DataType.BOOLEAN)
  accomplished: UserMissionAttribs['accomplished'];

  @Column(DataType.INTEGER)
  accomplishedCount: UserMissionAttribs['accomplishedCount'];

  get failed() {
    const accomplished = this.getDataValue('accomplished');
    if (typeof accomplished === 'boolean') {
      return !accomplished;
    }
    return accomplished;
  }
}
