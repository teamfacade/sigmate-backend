import { BelongsTo, HasOne, Model, Table } from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import Opinion from './Opinion';
import User from './User';
import UserDevice from './UserDevice';
import VerificationType from './VerificationType';

export interface OpinionVerificationAttributes {
  id: number;
  verificationType: VerificationType;
  verificationOpinion?: Opinion; // opinion explaining the verification
  subject: Opinion;
  createdByDevice: UserDevice;
  createdBy?: User;
  deletedByDevice?: UserDevice;
  deletedBy?: User;
}

export type OpinionVerificationCreationAttributes = Optional<
  OpinionVerificationAttributes,
  'id'
>;

@Table({
  tableName: 'opinion_verifications',
  modelName: 'OpinionVerification',
  timestamps: true,
  paranoid: true,
  underscored: true,
})
export default class OpinionVerification extends Model<
  OpinionVerificationAttributes,
  OpinionVerificationCreationAttributes
> {
  @BelongsTo(() => VerificationType)
  verificationType!: OpinionVerificationAttributes['verificationType'];

  @HasOne(() => Opinion, 'verificationOpinionId')
  verificationOpinion!: OpinionVerificationAttributes['verificationOpinion'];

  @BelongsTo(() => Opinion, 'subjectId')
  subject!: OpinionVerificationAttributes['subject'];

  @BelongsTo(() => UserDevice, 'createdByDeviceId')
  createdByDevice!: OpinionVerificationAttributes['createdByDevice'];

  @BelongsTo(() => User, 'createdById')
  createdBy!: OpinionVerificationAttributes['createdBy'];

  @BelongsTo(() => UserDevice, 'deletedByDeviceId')
  deletedByDevice: OpinionVerificationAttributes['deletedByDevice'];

  @BelongsTo(() => User, 'deletedById')
  deletedBy: OpinionVerificationAttributes['deletedBy'];
}
