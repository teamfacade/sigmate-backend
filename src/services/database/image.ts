import { Transaction } from 'sequelize/types';
import Image, { ImageCreationDTO } from '../../models/Image';
import User from '../../models/User';
import UserDevice from '../../models/UserDevice';
import ApiError from '../../utils/errors/ApiError';
import SequelizeError from '../../utils/errors/SequelizeError';
import UnauthenticatedError from '../../utils/errors/UnauthenticatedError';

export const createImage = async (
  imageCreationDTO: ImageCreationDTO,
  transaction: Transaction | undefined = undefined
) => {
  const { id, folder, originalFilesize, createdBy, createdByDevice } =
    imageCreationDTO;
  if (!createdBy) throw new UnauthenticatedError();
  if (!createdByDevice) throw new ApiError('ERR_IMAGE_CREATE_DEVICE');
  try {
    return await Image.create(
      {
        id,
        folder,
        originalFilesize,
        createdById: createdBy.id,
        createdByDeviceId: createdByDevice.id,
      },
      { transaction }
    );
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const deleteImage = async (
  image: Image,
  deletedBy: User | null,
  deletedByDevice: UserDevice | null,
  transaction: Transaction | undefined = undefined
) => {
  if (!image) return;
  if (!deletedBy) throw new UnauthenticatedError();
  if (!deletedByDevice) throw new ApiError('ERR_IMAGE_DELETE_DEVICE');
  try {
    await image.update({
      deletedById: deletedBy.id,
      deletedByDeviceId: deletedByDevice.id,
    });
    return await image.destroy({ transaction });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};
