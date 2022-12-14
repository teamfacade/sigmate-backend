import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Default,
  Model,
  Table,
} from 'sequelize-typescript';
import Penalty, { PenaltyAttribs } from './Penalty.model';
import User, { UserId } from './User.model';

export interface UserPenaltyAttribs {
  user?: User;
  userId?: UserId;
  penalty?: Penalty;
  penaltyId?: PenaltyAttribs['id'];
  score: number;
  createdAt: Date; // startedAt
  updatedAt: Date;
}

@Table({
  modelName: 'UserPenalty',
  tableName: 'user_penalties',
  timestamps: true,
  underscored: true,
  paranoid: false,
})
export default class UserPenalty extends Model<UserPenaltyAttribs> {
  @BelongsTo(() => User, {
    foreignKey: 'userId',
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  user: UserPenaltyAttribs['user'];

  @BelongsTo(() => Penalty, {
    foreignKey: 'penaltyId',
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  penalty: UserPenaltyAttribs['penalty'];

  @Default(0)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  score!: UserPenaltyAttribs['score'];
}
