import db from '../../../models';
import Block from '../../../models/Block';
import BlockVerification, {
  BlockVerificationDTO,
} from '../../../models/BlockVerification';
import Opinion from '../../../models/Opinion';
import VerificationType from '../../../models/VerificationType';
import NotFoundError from '../../../utils/errors/NotFoundError';
import SequelizeError from '../../../utils/errors/SequelizeError';

const defaultVerificationTypes = [
  {
    name: 'VERIFY',
    isUpVote: true,
  },
  {
    name: 'BE_AWARE',
    isUpVote: false,
  },
];

export const createDefaultVerificationTypes = async () => {
  try {
    return await db.sequelize.transaction(async (transaction) => {
      for (let i = 0; i < defaultVerificationTypes.length; i++) {
        const vt = defaultVerificationTypes[i];
        await VerificationType.findOrCreate({
          where: { name: vt.name },
          defaults: { name: vt.name, isUpvote: vt.isUpVote },
          transaction,
        });
      }
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const createBlockVerification = async (dto: BlockVerificationDTO) => {
  try {
    // Check if verification type exists
    let verificationType = await VerificationType.findOne({
      where: { name: dto.verificationType },
    });

    if (!verificationType) {
      const defaultVTypeNames = defaultVerificationTypes.map((vt) => vt.name);
      if (defaultVTypeNames.indexOf(dto.verificationType) >= 0) {
        await createDefaultVerificationTypes();
      }
    }

    verificationType = await VerificationType.findOne({
      where: { name: dto.verificationType },
    });

    // Get the latest block audit for this block
    const block = dto.block || (await Block.findByPk(dto.blockId));
    if (!block) throw new NotFoundError('ERR_BLOCK_NOT_EXISTS');
    const [blockAudit] = await block.$get('audits', {
      attributes: ['id'],
      order: [['createdBy', 'DESC']],
      limit: 1,
    });

    return await db.sequelize.transaction(async (transaction) => {
      if (!verificationType)
        throw new NotFoundError('ERR_VERIFICATION_TYPE_NOT_FOUND');
      // let verificationOpinion: OpinionCreationAttributes | undefined = undefined;
      const blockVerification = await BlockVerification.create(
        {
          verificationTypeId: verificationType.id,
          blockId: block.id,
          blockAuditId: blockAudit.id,
          createdById: dto.createdById || dto.createdBy?.id,
          createdByDeviceId: dto.createdByDeviceId || dto.createdByDevice?.id,
        },
        { transaction }
      );

      if (dto.opinion) {
        blockVerification.verificationOpinion = await Opinion.create(
          {
            title: dto.opinion.title,
            content: dto.opinion.content,
            blockVerificationId: blockVerification.id,
            createdById: dto.createdById || dto.createdBy?.id,
            createdByDeviceId: dto.createdByDeviceId || dto.createdByDevice?.id,
          },
          { transaction }
        );
      }

      return blockVerification;
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};
