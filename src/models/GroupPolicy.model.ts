import {
  AllowNull,
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  Default,
  IsIn,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import { MySQL$TEXT } from '../services/ModelService';
import Action, { ActionAttribs } from './Action.model';
import Mission, { MissionAttribs } from './Mission.model';
import Penalty, { PenaltyAttribs } from './Penalty.model';
import UserGroup from './UserGroup.model';

export interface GroupPolicyAttribs {
  id: number;
  name: string;
  description?: MySQL$TEXT;

  from?: UserGroup[];
  to: UserGroup;
  changeMode: 'PROMOTE' | 'DEMOTE' | 'ASSIGN';

  // Triggers
  action?: Action;
  actionId?: ActionAttribs['id'];
  mission?: Mission;
  missionId?: MissionAttribs['id'];
  penalty?: Penalty;
  penaltyId?: PenaltyAttribs['id'];

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

type GroupPolicyCAttribs = Optional<
  GroupPolicyAttribs,
  'id' | 'to' | 'changeMode' | 'createdAt' | 'updatedAt'
>;

@Table({
  modelName: 'GroupPolicy',
  tableName: 'group_policies',
  timestamps: true,
  underscored: true,
  paranoid: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class GroupPolicy extends Model<
  GroupPolicyAttribs,
  GroupPolicyCAttribs
> {
  @AllowNull(false)
  @Column(DataType.STRING)
  name!: GroupPolicyAttribs['name'];

  @BelongsToMany(() => UserGroup, {
    through: 'policy_from_groups',
    foreignKey: 'groupPolicyId',
    otherKey: 'userGroupId',
    as: 'from',
  })
  from: GroupPolicyAttribs['from'];

  @BelongsTo(() => UserGroup, { foreignKey: 'toGroupId' })
  to!: GroupPolicyAttribs['to'];

  @Default('ASSIGN')
  @AllowNull(false)
  @IsIn({
    msg: 'NOT_ALLOWED',
    args: [['PROMOTE', 'DEMOTE', 'ASSIGN']],
  })
  @Column(DataType.STRING)
  changeMode!: GroupPolicyAttribs['changeMode'];

  @BelongsTo(() => Mission, { foreignKey: 'missionId' })
  mission: GroupPolicyAttribs['mission'];

  @BelongsTo(() => Penalty, { foreignKey: 'penaltyId' })
  penalty: GroupPolicyAttribs['penalty'];

  @BelongsTo(() => Action, { foreignKey: 'actionId' })
  action: GroupPolicyAttribs['action'];
}
