import { BelongsTo, HasOne, Model, Table } from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import Block from './Block';
import Opinion, { OpinionAttributes } from './Opinion';
import User from './User';
import UserDevice from './UserDevice';
import VerificationType, { VerificationTypeResponse } from './VerificationType';

export interface BlockVerificationAttributes {
  id: number;
  verificationType: VerificationType;
  verificationOpinion?: Opinion; // opinion explaining the verification
  subject: Block;
  createdByDevice?: UserDevice;
  createdBy?: User;
  deletedByDevice?: UserDevice;
  deletedBy?: User;
}

export type BlockVerificationCreationAttributes = Optional<
  BlockVerificationAttributes,
  'id'
>;

export interface BlockVerificationResponse
  extends Pick<BlockVerificationAttributes, 'id'> {
  verificationType?: VerificationTypeResponse;
  verificationOpinion?: Pick<OpinionAttributes, 'id' | 'createdAt'> | null;
}

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

  @BelongsTo(() => UserDevice, {
    as: 'createdByDevice',
    foreignKey: 'createdByDeviceId',
  })
  createdByDevice: BlockVerificationAttributes['createdByDevice'];

  @BelongsTo(() => User, { as: 'createdBy', foreignKey: 'createdById' })
  createdBy: BlockVerificationAttributes['createdBy'];

  @BelongsTo(() => UserDevice, {
    as: 'deletedByDevice',
    foreignKey: 'deletedByDeviceId',
  })
  deletedByDevice: BlockVerificationAttributes['deletedByDevice'];

  @BelongsTo(() => User, { as: 'deletedBy', foreignKey: 'deletedById' })
  deletedBy: BlockVerificationAttributes['deletedBy'];

  async toResponseJSON(): Promise<BlockVerificationResponse> {
    const vt = await this.$get('verificationType');
    const vo = await this.$get('verificationOpinion', {
      attributes: ['id', 'createdAt'],
    });
    const vor = vo ? { id: vo.id, createdAt: vo.createdAt } : undefined;

    return {
      id: this.id,
      verificationType: vt?.toResponseJSON(),
      verificationOpinion: vor,
    };
  }
}
