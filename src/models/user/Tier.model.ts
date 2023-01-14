import {
  AllowNull,
  BelongsToMany,
  Column,
  DataType,
  HasMany,
  Is,
  Model,
  Table,
  Unique,
} from 'sequelize-typescript';
import { MYSQL_VALIDATORS } from '../../middlewares/validators';
import Privilege from './privilege/Privilege.model';
import TierPrivilege from './privilege/TierPrivilege.model';
import User from './User.model';

export interface TierAttribs {
  id: number;
  name: string;
  rank: number;
  emoji?: string;

  users?: User[];
  privileges?: Privilege[];
}

@Table({
  modelName: 'Tier',
  tableName: 'tiers',
  timestamps: false,
  underscored: true,
  paranoid: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class Tier extends Model<TierAttribs> {
  @AllowNull(false)
  @Column(DataType.STRING(191))
  name!: TierAttribs['name'];

  @Is('mysqlint', MYSQL_VALIDATORS.INT)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  rank!: TierAttribs['rank'];

  @Unique('tier.emoji')
  @Column(DataType.STRING(2))
  emoji: TierAttribs['emoji'];

  @HasMany(() => User, { foreignKey: 'tierId', as: 'users' })
  users: TierAttribs['users'];

  @BelongsToMany(() => Privilege, {
    through: () => TierPrivilege,
    as: 'privileges',
    foreignKey: 'tierId',
    otherKey: 'privilegeId',
  })
  privileges: TierAttribs['privileges'];
}
