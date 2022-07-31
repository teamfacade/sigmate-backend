import {
  AllowNull,
  Column,
  DataType,
  Index,
  Table,
  Model,
  HasMany,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import UserDevice from './UserDevice';

export interface UserAgentAttributes {
  id: number;
  uaHash: string;
  uaText: string;
  userDevices: UserDevice[];
}

export type UserAgentCreationAttributes = Optional<
  UserAgentAttributes,
  'id' | 'uaHash'
>;

@Table({
  tableName: 'user_agents',
  modelName: 'UserAgent',
  timestamps: false,
  paranoid: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class UserAgent extends Model<
  UserAgentAttributes,
  UserAgentCreationAttributes
> {
  @Index('uaHash')
  @AllowNull(false)
  @Column(DataType.STRING(32))
  uaHash!: UserAgentAttributes['uaHash'];

  @AllowNull(false)
  @Column(DataType.TEXT)
  uaText!: UserAgentAttributes['uaText'];

  @HasMany(() => UserDevice, 'userAgentId')
  userDevices!: UserAgentAttributes['userDevices'];
}
