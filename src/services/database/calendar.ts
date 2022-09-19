import { Op } from 'sequelize';
import { DateTime } from 'luxon';
import { PaginationOptions } from '../../middlewares/handlePagination';
import MintingSchedule, {
  MintingScheduleCreationAttributes,
} from '../../models/MintingSchedule';
import SequelizeError from '../../utils/errors/SequelizeError';
import { CollectionAttributes } from '../../models/Collection';
import { UserAttributes } from '../../models/User';
import { UserDeviceAttributes } from '../../models/UserDevice';

export const getMintingScheduleWithinPeriod = async (
  start: DateTime,
  end: DateTime,
  pg: PaginationOptions | undefined = undefined
) => {
  try {
    return await MintingSchedule.findAndCountAll({
      where: {
        mintingTime: {
          [Op.between]: [start.toJSDate(), end.toJSDate()],
        },
      },
      order: [['mintingTime', 'ASC']],
      limit: pg?.limit,
      offset: pg?.offset,
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const createMintingSchedule = async (
  dto: MintingScheduleCreationAttributes
) => {
  try {
    const collectionId: CollectionAttributes['id'] =
      dto.collectionId || dto.collection?.id;
    const createdById: UserAttributes['id'] =
      dto.createdById || dto.createdBy?.id;
    const createdByDeviceId: UserDeviceAttributes['id'] =
      dto.createdByDeviceId || dto.createdByDevice?.id;

    return await MintingSchedule.create({
      name: dto.name,
      tier: dto.tier,
      mintingTime: dto.mintingTime,
      mintingUrl: dto.mintingUrl,
      description: dto.description,
      collectionId,
      mintingPrice: dto.mintingPrice,
      mintingPriceSymbol: dto.mintingPriceSymbol,
      createdById,
      createdByDeviceId,
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};
