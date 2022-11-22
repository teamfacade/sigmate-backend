import User, { UserAttributes } from './User';
import {
  Model,
  Column,
  DataType,
  Table,
  BelongsTo,
  AllowNull,
  Length,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import UserPointPolicy, { UserPointPolicyAttributes } from './UserPointPolicy';

export interface UserPointAttributes {
  id: number;
  points: number;
  policy?: UserPointPolicy;
  policyId?: UserPointPolicyAttributes['id'];
  /**
   * Primary key of the action target.
   * e.g. prevent receiving too many points by editing the same post, etc.
   */
  targetPk?: number;

  grantedTo?: User;
  grantedToId?: UserAttributes['id'];
  /** If admin user decides to manually grant points */
  grantedBy?: User;
  grantedById?: UserAttributes['id'];
  revokedBy?: User;
  revokedById?: UserAttributes['id'];
  revokedAt?: Date;
  revokedReason?: string;

  createdAt?: Date;
  updatedAt?: Date;

  // transferRequestedAt?: Date;
  // transferApprovedAt?: Date;
  // transferApprovedBy?: User;
  // transferApprovedById?: UserAttributes['id'];
  // transferRate?: number;
  // transferRejectedAt?: Date;
  // transferRejectedBy?: User;
  // transferRejectedById?: UserAttributes['id'];
  // transferRejectReason?: string;
}

type UserPointCreationAttributes = Optional<UserPointAttributes, 'id'>;

@Table({
  modelName: 'UserPoint',
  tableName: 'user_points',
  timestamps: true,
  underscored: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class UserPoint extends Model<
  UserPointAttributes,
  UserPointCreationAttributes
> {
  @AllowNull(false)
  @Column(DataType.INTEGER)
  points!: UserPointAttributes['points'];

  @BelongsTo(() => UserPointPolicy, 'policyId')
  policy: UserPointAttributes['policy'];

  @Column(DataType.INTEGER)
  targetPk: UserPointAttributes['targetPk'];

  @BelongsTo(() => User, { as: 'grantedTo', foreignKey: 'grantedToId' })
  grantedTo: UserPointAttributes['grantedTo'];

  @BelongsTo(() => User, { as: 'grantedBy', foreignKey: 'grantedById' })
  grantedBy: UserPointAttributes['grantedBy'];

  @BelongsTo(() => User, {
    as: 'revokedBy',
    foreignKey: 'revokedById',
  })
  revokedBy: UserPointAttributes['revokedBy'];

  @Column(DataType.DATE)
  revokedAt: UserPointAttributes['revokedAt'];

  @Length({ min: 0, max: 255 })
  @Column(DataType.STRING)
  revokedReason: UserPointAttributes['revokedReason'];

  // TODO Create a separate table for transfers
  // @Column(DataType.DATE)
  // transferRequestedAt: UserPointAttributes['transferRequestedAt'];
  // @Column(DataType.DATE)
  // transferApprovedAt: UserPointAttributes['transferApprovedAt'];

  // @BelongsTo(() => User, {
  //   as: 'transferApprovedBy',
  //   foreignKey: 'transferApprovedById',
  // })
  // transferApprovedBy: UserPointAttributes['transferApprovedBy'];

  // @Column(DataType.DOUBLE)
  // transferRate: UserPointAttributes['transferRate'];

  // @Column(DataType.DATE)
  // transferRejectedAt: UserPointAttributes['transferRejectedAt'];

  // @BelongsTo(() => User, {
  //   as: 'transferRejectedBy',
  //   foreignKey: 'transferRejectedById',
  // })
  // transferRejectedBy: UserPointAttributes['transferRejectedBy'];

  // @Length({ min: 0, max: 255 })
  // @Column(DataType.STRING)
  // transferRejectReason: UserPointAttributes['transferRejectReason'];
}
