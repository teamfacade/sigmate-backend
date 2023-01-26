import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Default,
  Length,
  Model,
  Table,
} from 'sequelize-typescript';
import User, { UserId } from '../User.model';
import Restriction, { RestrictionAttribs } from './Restriction.model';

export interface UserRestrictionAttribs {
  id: number;
  /** The Nth time a user has been restricted */
  count: number;
  startedAt: Date;
  endsAt?: Date;
  reason?: string;
  givenBy?: User;
  givenById?: UserId;

  user?: User;
  userId?: UserId;
  restriction?: Restriction;
  restrictionId?: RestrictionAttribs['id'];
}

@Table({
  modelName: 'UserRestriction',
  tableName: 'user_restrictions',
  timestamps: false,
  underscored: true,
  paranoid: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class UserRestriction extends Model<UserRestrictionAttribs> {
  @Default(0)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  count!: UserRestrictionAttribs['count'];

  @Default(DataType.NOW)
  @AllowNull(false)
  @Column(DataType.DATE)
  startedAt!: UserRestrictionAttribs['startedAt'];

  @Column(DataType.DATE)
  endsAt: UserRestrictionAttribs['endsAt'];

  @Length({ max: 255 })
  @Column(DataType.STRING)
  reason: UserRestrictionAttribs['reason'];

  @BelongsTo(() => User, { foreignKey: 'givenById', as: 'givenBy' })
  givenBy: UserRestrictionAttribs['givenBy'];

  // THROUGH
  @BelongsTo(() => User, { foreignKey: 'userId', as: 'user' })
  user: UserRestrictionAttribs['user'];

  // THROUGH
  @BelongsTo(() => Restriction, { foreignKey: 'restrictionId' })
  restriction: UserRestrictionAttribs['restriction'];
}
