import { BelongsTo, HasOne, Model, Table } from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import Block from './Block';
import Opinion from './Opinion';
import User from './User';
import UserDevice from './UserDevice';
import VerificationType from './VerificationType';

export interface BlockVerificationAttributes {
  id: number;
  verificationType: VerificationType;
  verificationOpinion?: Opinion; // opinion explaining the verification
  subject: Block;
  createdByDevice: UserDevice;
  createdBy: User;
  deletedByDevice?: UserDevice;
  deletedBy?: User;
}

export type BlockVerificationCreationAttributes = Optional<
  BlockVerificationAttributes,
  'id'
>;

@Table({
  tableName: 'block_verifications',
  modelName: 'BlockVerification',
  timestamps: true,
  paranoid: true,
  underscored: true,
})
export default class BlockVerification extends Model<
  BlockVerificationAttributes,
  BlockVerificationCreationAttributes
> {
  @BelongsTo(() => VerificationType, 'vtypeId')
  verificationType!: BlockVerificationAttributes['verificationType'];

  @HasOne(() => Opinion, 'blockVerificationId')
  verificationOpinion: BlockVerificationAttributes['verificationOpinion'];

  @BelongsTo(() => Block, 'blockId')
  subject!: BlockVerificationAttributes['subject'];

  @BelongsTo(() => UserDevice, 'createdByDeviceId')
  createdByDevice!: BlockVerificationAttributes['createdByDevice'];

  @BelongsTo(() => User, 'createdById')
  createdBy!: BlockVerificationAttributes['createdBy'];

  @BelongsTo(() => UserDevice, 'deletedByDeviceId')
  deletedByDevice: BlockVerificationAttributes['deletedByDevice'];

  @BelongsTo(() => User, 'deletedById')
  deletedBy: BlockVerificationAttributes['deletedBy'];
}
