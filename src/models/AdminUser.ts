import {
  Column,
  Model,
  Table,
  DataType,
  BelongsTo,
  AllowNull,
  Default,
} from 'sequelize-typescript';
import User, { UserIdType } from './User';
import UserDevice from './UserDevice';

export interface AdminUserAttributes {
  id: UserIdType;
  user: User;
  appointedBy: User;
  appointedByDevice: UserDevice;
  appointedAt: Date;
  canAdminContent: boolean;
  canAdminUsers: boolean;
  canAdminEvents: boolean;
  canAdminAds: boolean;
  canAppointAdmins: boolean;
}

export type AdminUserCreationAttributes = AdminUserAttributes;

@Table({
  tableName: 'admin_users',
  modelName: 'AdminUser',
  timestamps: true,
  underscored: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class AdminUser extends Model<
  AdminUserAttributes,
  AdminUserCreationAttributes
> {
  @BelongsTo(() => User, { as: 'adminUser', foreignKey: 'userId' })
  user!: AdminUserAttributes['user'];

  @BelongsTo(() => User, {
    as: 'appointedAdminUsers',
    foreignKey: 'appointedById',
  })
  appointedBy!: AdminUserAttributes['appointedBy'];

  @BelongsTo(() => UserDevice, 'appointedByDeviceId')
  appointedByDevice!: AdminUserAttributes['appointedByDevice'];

  @Column(DataType.DATE)
  appointedAt!: AdminUserAttributes['appointedAt'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canAdminContent!: AdminUserAttributes['canAdminContent'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canAdminUsers!: AdminUserAttributes['canAdminUsers'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canAdminEvents!: AdminUserAttributes['canAdminEvents'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canAdminAds!: AdminUserAttributes['canAdminAds'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canAppointAdmins!: AdminUserAttributes['canAppointAdmins'];
}
