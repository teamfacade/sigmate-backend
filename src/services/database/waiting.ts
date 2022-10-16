import WaitingList, {
  WaitingListCreationAttributes,
} from '../../models/WaitingList';
import ApiError from '../../utils/errors/ApiError';
import SequelizeError from '../../utils/errors/SequelizeError';

export const getWaitingListCount = async () => {
  try {
    return await WaitingList.count();
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const addEmailToWaitingList = async (
  dto: WaitingListCreationAttributes
) => {
  const { email, createdByDevice } = dto;

  const createdByDeviceId = dto.createdByDeviceId || createdByDevice?.id;
  if (!createdByDeviceId) throw new ApiError('ERR_ADD_EMAIL_WAITING_DEVICE');

  try {
    const [wl, created] = await WaitingList.findOrCreate({
      where: { email },
      defaults: { email, createdByDeviceId },
    });

    if (!created) return null;

    return wl;
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};
