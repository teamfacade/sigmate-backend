import { Column, ForeignKey, Model, Table, Unique } from 'sequelize-typescript';
import Device from './Device.model';
import User from './User.model';

@Table({
  tableName: 'user_devices',
  modelName: 'UserDevice',
  timestamps: true,
  underscored: true,
})
export default class UserDevice extends Model {
  @Unique('userDevice')
  @ForeignKey(() => User)
  @Column
  userId!: number;

  @Unique('userDevice')
  @ForeignKey(() => Device)
  @Column
  deviceId!: number;
}
