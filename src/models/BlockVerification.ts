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
  creatorDevice: UserDevice;
  creator?: User;
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
  @BelongsTo(() => VerificationType)
  verificationType!: BlockVerificationAttributes['verificationType'];

  @HasOne(() => Opinion)
  verificationOpinion: BlockVerificationAttributes['verificationOpinion'];

  @BelongsTo(() => Block)
  subject!: BlockVerificationAttributes['subject'];

  @BelongsTo(() => UserDevice)
  creatorDevice!: BlockVerificationAttributes['creatorDevice'];

  @BelongsTo(() => User)
  creator!: BlockVerificationAttributes['creator'];
}
