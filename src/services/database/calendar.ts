import { Op } from 'sequelize';
import { DateTime } from 'luxon';
import { PaginationOptions } from '../../middlewares/handlePagination';
import MintingSchedule, {
  MintingScheduleAttributes,
  MintingScheduleCreationAttributes,
  MintingScheduleUpdateDTO,
} from '../../models/MintingSchedule';
import SequelizeError from '../../utils/errors/SequelizeError';
import { CollectionAttributes } from '../../models/Collection';
import User, { UserAttributes } from '../../models/User';
import { UserDeviceAttributes } from '../../models/UserDevice';
import UnauthenticatedError from '../../utils/errors/UnauthenticatedError';
import NotFoundError from '../../utils/errors/NotFoundError';

export const getMintingScheudleById = async (
  id: MintingScheduleAttributes['id']
) => {
  try {
    return await MintingSchedule.findByPk(id);
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

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

export const updateMintingScheduleById = async (
  id: MintingScheduleAttributes['id'],
  dto: MintingScheduleUpdateDTO
) => {
  try {
    const collectionId: CollectionAttributes['id'] | undefined =
      dto.collectionId || dto.collection?.id || undefined;
    const updatedById: UserAttributes['id'] | undefined =
      dto.updatedById || dto.updatedBy?.id || undefined;
    const updatedByDeviceId: UserDeviceAttributes['id'] | undefined =
      dto.updatedByDeviceId || dto.updatedByDevice?.id || undefined;

    await MintingSchedule.update(
      {
        name: dto.name,
        tier: dto.tier,
        mintingTime: dto.mintingTime,
        mintingUrl: dto.mintingUrl,
        description: dto.description,
        collectionId,
        mintingPrice: dto.mintingPrice,
        mintingPriceSymbol: dto.mintingPriceSymbol,
        updatedById,
        updatedByDeviceId,
      },
      { where: { id } }
    );

    return await MintingSchedule.findByPk(id);
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const getMyMintingSchedulesWithinPeriod = async (
  start: DateTime,
  end: DateTime,
  user: User | null,
  pg: PaginationOptions | undefined = undefined
) => {
  try {
    if (!user) throw new UnauthenticatedError();
    const mss = await user.$get('savedMintingSchedules', {
      where: {
        mintingTime: {
          [Op.between]: [start.toJSDate(), end.toJSDate()],
        },
      },
      order: [['mintingTime', 'ASC']],
      limit: pg?.limit,
      offset: pg?.offset,
    });
    const count = await user.$count('savedMintingSchedules');
    return { rows: mss, count };
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const saveMintingScheduleById = async (
  id: MintingScheduleAttributes['id'],
  user: User | null
) => {
  if (!user) throw new UnauthenticatedError();
  try {
    const ms = await getMintingScheudleById(id);
    if (!ms) return null;
    await ms.$add('savedUsers', user);
    return ms;
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const unsaveMintingScheduleById = async (
  id: MintingScheduleAttributes['id'],
  user: User | null
) => {
  if (!user) throw new UnauthenticatedError();
  try {
    const ms = await getMintingScheudleById(id);
    if (!ms) throw new NotFoundError();
    await user.$remove('savedMintingSchedules', ms);
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};
