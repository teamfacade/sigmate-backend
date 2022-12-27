import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Default,
  Length,
  Model,
  Table,
} from 'sequelize-typescript';
import { MySQL$TEXT } from '../services/ModelService';
import Action, { ActionAttribs } from './Action.model';
import Mission, { MissionAttribs } from './Mission.model';
import Penalty, { PenaltyAttribs } from './Penalty.model';

export interface PointPolicyAttribs {
  id: number;
  name: string;
  description?: MySQL$TEXT;

  /**
   * Points change by `amount + wegiht * metric`. Defaults to `0`
   */
  amount: number;
  /**
   * Points change by `amount + wegiht * metric`. Defaults to `0`
   */
  weight?: number;
  /**
   * Prevent points from decreasing more than this value
   */
  decreaseLimit?: number | null;
  /**
   * Prevent points from increasing more than this value
   */
  increaseLimit?: number | null;

  /**
   * Any attempts to change points based on this policy will
   * fail or be ignored before this date
   */
  isValidFrom?: Date;

  /**
   * If set to `true`, users will receive points automatically
   * if they have the correct privileges.
   * If set to `false`, points will be held in a pending state
   */
  receive: boolean;

  // Triggers
  action?: Action;
  actionId?: ActionAttribs['id'];
  mission?: Mission;
  missionId?: MissionAttribs['id'];
  penalty?: Penalty;
  penaltyId?: PenaltyAttribs['id'];

  // When policies are 'edited', new versions are created
  originalPolicy?: PointPolicy;
  originalPolicyId?: PointPolicyAttribs['id'];

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

@Table({
  modelName: 'PointPolicy',
  tableName: 'point_policies',
  timestamps: true,
  underscored: true,
  paranoid: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class PointPolicy extends Model<PointPolicyAttribs> {
  @Length({ min: 1, max: 191 })
  @AllowNull(false)
  @Column(DataType.STRING(191))
  name!: PointPolicyAttribs['name'];

  @Column(DataType.TEXT)
  description: PointPolicyAttribs['description'];

  @Default(0)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  amount!: PointPolicyAttribs['amount'];

  @Column(DataType.INTEGER)
  weight: PointPolicyAttribs['weight'];

  @Column(DataType.INTEGER)
  decreaseLimit: PointPolicyAttribs['decreaseLimit'];

  @Column(DataType.INTEGER)
  increaseLimit: PointPolicyAttribs['increaseLimit'];

  @Column(DataType.DATE)
  isValidFrom: PointPolicyAttribs['isValidFrom'];

  @Default(true)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  receive!: PointPolicyAttribs['receive'];

  @BelongsTo(() => Action, { foreignKey: 'actionId' })
  action: PointPolicyAttribs['action'];

  @BelongsTo(() => Mission, 'missionId')
  mission: PointPolicyAttribs['mission'];

  @BelongsTo(() => Penalty, 'penaltyId')
  penalty: PointPolicyAttribs['penalty'];

  @BelongsTo(() => PointPolicy, {
    foreignKey: 'originalPolicyId',
    as: 'originalPolicy',
  })
  originalPolicy: PointPolicyAttribs['originalPolicy'];
}
