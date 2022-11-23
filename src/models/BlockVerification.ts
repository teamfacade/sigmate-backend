import { BelongsTo, HasOne, Model, Table } from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import Block, { BlockAttributes } from './Block';
import BlockAudit, { BlockAuditAttributes } from './BlockAudit';
import Opinion, { OpinionAttributes } from './Opinion';
import User, { UserAttributes } from './User';
import UserDevice, { UserDeviceAttributes } from './UserDevice';
import VerificationType, {
  VerificationTypeAttributes,
  VerificationTypeResponse,
} from './VerificationType';

export interface BlockVerificationAttributes {
  id: number;
  verificationType?: VerificationType;
  verificationTypeId?: VerificationTypeAttributes['id'];
  verificationOpinion?: Opinion; // opinion explaining the verification
  block?: Block;
  blockId?: BlockAttributes['id'];
  blockAudit?: BlockAudit;
  blockAuditId?: BlockAuditAttributes['id'];
  createdByDevice?: UserDevice;
  createdByDeviceId?: UserDeviceAttributes['id'];
  createdBy?: User;
  createdById?: UserAttributes['id'];
  deletedByDevice?: UserDevice;
  deletedBy?: User;
  createdAt?: User;
  updatedAt?: User;
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

export interface BlockVerificationDTO {
  verificationType: VerificationTypeAttributes['name'];
  opinion?: {
    title?: OpinionAttributes['title'];
    content: OpinionAttributes['content'];
  };
  block?: OpinionAttributes['block'];
  blockId?: OpinionAttributes['blockId'];
  createdBy?: BlockVerificationAttributes['createdBy'];
  createdById?: BlockVerificationAttributes['createdById'];
  createdByDevice?: BlockVerificationAttributes['createdByDevice'];
  createdByDeviceId?: BlockVerificationAttributes['createdByDeviceId'];
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
  @BelongsTo(() => VerificationType, 'verificationTypeId')
  verificationType!: BlockVerificationAttributes['verificationType'];

  @HasOne(() => Opinion, 'blockVerificationId')
  verificationOpinion: BlockVerificationAttributes['verificationOpinion'];

  @BelongsTo(() => Block, 'blockId')
  block: BlockVerificationAttributes['block'];

  @BelongsTo(() => BlockAudit, 'blockAuditId')
  blockAudit: BlockVerificationAttributes['blockAudit'];

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
