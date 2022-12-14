import { BelongsTo, Model, Table } from 'sequelize-typescript';
import { MySQL$TEXT } from '../services/ModelService';
import Mission, { MissionAttribs } from './Mission.model';
import Penalty, { PenaltyAttribs } from './Penalty.model';

export interface PointPolicyAttribs {
  id: number;
  name: string;
  description: MySQL$TEXT;

  /**
   * Points change by `amount + wegiht * metric`. Defaults to `0`
   */
  amount: number;
  /**
   * Points change by `amount + wegiht * metric`. Defaults to `0`
   */
  weight?: number;
  /**
   * If set, points change by `max(lowerLimit, amount + weight * metric)`
   */
  lowerLimit?: number | null;
  /**
   * If set, points change by `min(amount + weight * metric, upperLimit)`
   */
  upperLimit?: number | null;

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
  receive?: boolean;

  // Triggers
  actionName?: string;
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
  @BelongsTo(() => Mission, 'missionId')
  mission: PointPolicyAttribs['mission'];

  @BelongsTo(() => Penalty, 'penaltyId')
  penalty: PointPolicyAttribs['penalty'];
}
