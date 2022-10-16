import { Request, Response, NextFunction } from 'express';
import {
  addEmailToWaitingList,
  getWaitingListCount,
} from '../database/waiting';

export const getWaitingListCountController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const count = await getWaitingListCount();
    res.status(200).json({ success: true, count });
  } catch (error) {
    next(error);
  }
};

type AddEmailToWaitingListReqBody = {
  email: string;
};

export const addEmailToWaitingListController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body as AddEmailToWaitingListReqBody;
    const device = req.device;

    const wl = await addEmailToWaitingList({
      email,
      createdByDevice: device,
    });

    if (wl) {
      return res.status(201).json({ success: true, email });
    }

    res.status(500).json({ success: false, msg: 'NOT_CREATED' });
  } catch (error) {
    next(error);
  }
};
