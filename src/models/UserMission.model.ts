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
  score: number;
  canProgress?: boolean;
  endedAt?: Date; // completed or failed

  createdAt: Date; // acceptedAt
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

  @Column(DataType.BOOLEAN)
  canProgress: UserMissionAttribs['canProgress'];

  @Column(DataType.DATE)
  endedAt: UserMissionAttribs['endedAt'];
}
