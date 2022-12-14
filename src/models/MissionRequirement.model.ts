import { BelongsTo, Model, Table } from 'sequelize-typescript';
import Mission from './Mission.model';

@Table({
  modelName: 'MissionRequirement',
  tableName: 'mission_requirements',
  timestamps: false,
  underscored: true,
  paranoid: false,
})
export default class MissionRequirement extends Model {
  @BelongsTo(() => Mission, {
    as: 'mission',
    foreignKey: 'missionId',
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  mission!: Mission;

  @BelongsTo(() => Mission, {
    as: 'required',
    foreignKey: 'requiredId',
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  required!: Mission;
}
