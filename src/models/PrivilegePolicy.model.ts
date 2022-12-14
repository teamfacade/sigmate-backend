import {
  AllowNull,
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  Length,
  Model,
  Table,
} from 'sequelize-typescript';
import Mission, { MissionAttribs } from './Mission.model';
import Penalty, { PenaltyAttribs } from './Penalty.model';
import Privilege from './Privilege.model';

export interface PrivilegePolicyAttribs {
  id: number;
  name: string;
  description?: string;

  grant?: Privilege[];
  revoke?: Privilege[];
  unset?: Privilege[];

  actionName?: string;
  mission?: Mission;
  missionId?: MissionAttribs['id'];
  penalty?: Penalty;
  penaltyId?: PenaltyAttribs['id'];

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

@Table({
  tableName: 'privilege_policies',
  modelName: 'PrivilegePolicy',
  timestamps: true,
  underscored: true,
  paranoid: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class PrivilegePolicy extends Model<PrivilegePolicyAttribs> {
  @Length({ msg: 'LENGTH', min: 1, max: 191 })
  @AllowNull(false)
  @Column(DataType.STRING(191))
  name!: PrivilegePolicyAttribs['name'];

  @Length({ msg: 'LENGTH', min: 0, max: 255 })
  @Column(DataType.STRING)
  description: PrivilegePolicyAttribs['description'];

  @BelongsToMany(() => Privilege, {
    through: 'privilege_grant_policies',
    foreignKey: 'privilegePolicyId',
    otherKey: 'privilegeId',
    as: 'grant',
  })
  grant: PrivilegePolicyAttribs['grant'];

  @BelongsToMany(() => Privilege, {
    through: 'privilege_revoke_policies',
    foreignKey: 'privilegePolicyId',
    otherKey: 'privilegeId',
    as: 'revoke',
  })
  revoke: PrivilegePolicyAttribs['revoke'];

  @BelongsToMany(() => Privilege, {
    through: 'privilege_unset_policies',
    foreignKey: 'privilegePolicyId',
    otherKey: 'privilegeId',
    as: 'unset',
  })
  unset: PrivilegePolicyAttribs['unset'];

  @Column(DataType.STRING)
  actionName: PrivilegePolicyAttribs['actionName'];

  @BelongsTo(() => Mission, { foreignKey: 'missionId' })
  mission: PrivilegePolicyAttribs['mission'];

  @BelongsTo(() => Penalty, { foreignKey: 'penaltyId' })
  penalty: PrivilegePolicyAttribs['penalty'];
}
