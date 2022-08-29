import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import User from './User';
import UserDevice from './UserDevice';

@Table({
  tableName: 'user_owned_devices',
  modelName: 'UserOwnedDevice',
  timestamps: false,
  underscored: true,
})
export default class UserOwnedDevice extends Model {
  @ForeignKey(() => User)
  @Column
  userId!: number;

  @ForeignKey(() => UserDevice)
  @Column
  userDeviceId!: number;
}
