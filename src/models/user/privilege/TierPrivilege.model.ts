import {
  Model,
  Table,
  Column,
  DataType,
  AllowNull,
  BelongsTo,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import Tier, { TierAttribs } from '../Tier.model';
import Privilege, { PrivilegeAttribs } from './Privilege.model';

export interface TierPrivilegeAttribs {
  id: number;
  grant: boolean;
  tier?: Tier;
  tierId?: TierAttribs['id'];
  privilege?: Privilege;
  privilegeId?: PrivilegeAttribs['id'];

  createdAt: Date;
  updatedAt: Date;
}

type TierPrivilegeCAttribs = Optional<
  TierPrivilegeAttribs,
  'id' | 'createdAt' | 'updatedAt'
>;

@Table({
  modelName: 'TierPrivilege',
  tableName: 'tier_privileges',
  timestamps: true,
  underscored: true,
  paranoid: false,
})
export default class TierPrivilege extends Model<
  TierPrivilegeAttribs,
  TierPrivilegeCAttribs
> {
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  grant!: TierPrivilegeAttribs['grant'];

  @BelongsTo(() => Tier, { foreignKey: 'tierId' })
  tier: TierPrivilegeAttribs['tier'];

  @BelongsTo(() => Privilege, { foreignKey: 'privilegeId' })
  privilege: TierPrivilegeAttribs['privilege'];
}
