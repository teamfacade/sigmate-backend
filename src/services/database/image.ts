import Image, { ImageCreationDTO } from '../../models/Image';
import ApiError from '../../utils/errors/ApiError';
import SequelizeError from '../../utils/errors/SequelizeError';
import UnauthenticatedError from '../../utils/errors/UnauthenticatedError';

export const createImage = async (imageCreationDTO: ImageCreationDTO) => {
  const { id, folder, originalFilesize, createdBy, createdByDevice } =
    imageCreationDTO;
  if (!createdBy) throw new UnauthenticatedError();
  if (!createdByDevice) throw new ApiError('ERR_DEVICE');
  try {
    return await Image.create({
      id,
      folder,
      originalFilesize,
      createdById: createdBy.id,
      createdByDeviceId: createdByDevice.id,
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};
