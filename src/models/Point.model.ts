import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import PointPolicy, { PointPolicyAttribs } from './PointPolicy.model';
import User, { UserId } from './User.model';
import UserPrivilege, { UserPrivilegeAttribs } from './UserPrivilege.model';

export interface PointAttribs {
  id: number;
  amount: number; // signed
  policy?: PointPolicy;
  policyId?: PointPolicyAttribs['id'];
  // TODO event: Event;

  /** Leave this to `null` to leave point 'PENDING' */
  receivedAt?: Date;
  receivedBy?: User;
  receivedById?: UserId;

  /**
   * The admin user who gave the points manually.
   * Or, for referral points, the referred user.
   */
  givenBy?: User;
  givenById?: UserId;

  revokedAt?: Date;
  revokedBy?: User; // Admin
  revokedById?: UserId;

  /**
   * Points revoked by a `UserPrivilege` entry.
   *
   * (NOTE: Points revoked by a `GroupPrivilege` entry will not
   * create a `Point` entry)
   */
  revokedByUserPrivilege?: UserPrivilege;
  revokedByUserPrivilegeId?: UserPrivilegeAttribs['id'];

  createdAt: Date;
  updatedAt: Date;
}

type PointStatus = 'PENDING' | 'RECEIVED' | 'REVOKED' | 'CONFLICT';

@Table({
  modelName: 'Point',
  tableName: 'points',
  timestamps: true,
  underscored: true,
  paranoid: false,
})
export default class Point extends Model<PointAttribs> {
  @AllowNull(false)
  @Column(DataType.INTEGER)
  amount!: PointAttribs['amount'];

  @BelongsTo(() => PointPolicy, { foreignKey: 'policyId' })
  policy: PointAttribs['policy'];

  @Column(DataType.DATE)
  receivedAt: PointAttribs['receivedAt'];

  @BelongsTo(() => User, { foreignKey: 'receivedById', as: 'receivedBy' })
  receivedBy: PointAttribs['receivedBy'];

  @BelongsTo(() => User, {
    foreignKey: 'givenById',
    as: 'givenBy',
  })
  givenBy: PointAttribs['givenBy'];

  @Column(DataType.DATE)
  revokedAt: PointAttribs['revokedAt'];

  @BelongsTo(() => User, {
    foreignKey: 'revokedById',
    as: 'revokedBy',
  })
  revokedBy: PointAttribs['revokedBy'];

  @BelongsTo(() => UserPrivilege, {
    foreignKey: 'revokedByUserPrivilegeId',
  })
  revokedByUserPrivilege: PointAttribs['revokedByUserPrivilege'];

  get status(): PointStatus {
    const receivedAt = this.getDataValue('receivedAt');
    const revokedAt = this.getDataValue('revokedAt');
    if (!receivedAt && !revokedAt) {
      return 'PENDING';
    } else if (receivedAt && !revokedAt) {
      return 'RECEIVED';
    } else if (revokedAt) {
      return 'REVOKED';
    } else {
      return 'CONFLICT';
    }
  }
}
