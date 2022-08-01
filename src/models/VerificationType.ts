import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript';
import BlockVerification from './BlockVerification';
import OpinionVerification from './OpinionVerification';
import UrlVerification from './UrlVerification';

export interface VerificationTypeAttributes {
  id: number;
  name: string;
  isUpvote: boolean;
  blockVerifications?: BlockVerification[];
  opinionVerifications?: OpinionVerification[];
  urlVerifications?: UrlVerification[];
}

@Table({
  tableName: 'verification_types',
  modelName: 'VerificationType',
  timestamps: false,
  paranoid: false,
  underscored: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class VerificationType extends Model<VerificationTypeAttributes> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: false,
  })
  id!: VerificationTypeAttributes['id'];

  @Column(DataType.STRING(191))
  name!: VerificationTypeAttributes['name'];

  @Column(DataType.BOOLEAN)
  isUpvote!: VerificationTypeAttributes['isUpvote'];

  @HasMany(() => BlockVerification)
  blockVerifications!: VerificationTypeAttributes['blockVerifications'];

  @HasMany(() => OpinionVerification)
  opinionVerifications!: VerificationTypeAttributes['opinionVerifications'];

  @HasMany(() => UrlVerification)
  urlVerifications!: VerificationTypeAttributes['urlVerifications'];
}
