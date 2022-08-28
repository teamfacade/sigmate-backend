import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import MintingSchedule from './MintingSchedule';
import User from './User';

@Table
export default class UserSavedMintingSchedule extends Model {
  @ForeignKey(() => User)
  @Column
  userId!: number;

  @ForeignKey(() => MintingSchedule)
  @Column
  mintingScheduleId!: number;
}
