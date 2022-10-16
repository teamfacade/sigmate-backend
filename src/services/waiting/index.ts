import { Request, Response, NextFunction } from 'express';
import { addEmailToWaitingList } from '../database/waiting';

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
