import { Request, Response, NextFunction } from 'express';
import { ImageCreateRequestBody } from '../../models/Image';
import UnauthenticatedError from '../../utils/errors/UnauthenticatedError';
import { createImage } from '../database/image';

export const createImageController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const folder = req.query.folder as unknown as string;
    const originalFilesize = req.file?.size || 0;
    const { id } = req.body as unknown as ImageCreateRequestBody;
    const createdBy = req.user;
    const createdByDevice = req.device;
    if (!createdBy || !createdByDevice) throw new UnauthenticatedError();
    const image = await createImage({
      id,
      folder,
      originalFilesize,
      createdBy,
      createdByDevice,
    });
    res.status(201).json({
      success: true,
      image: await image.toResponseJSON(),
    });
  } catch (error) {
    next(error);
  }
};
