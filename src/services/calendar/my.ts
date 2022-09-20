import { NextFunction, Request, Response } from 'express';
import { DateTime } from 'luxon';
import {
  createPgRes,
  PaginatedResponse,
  PaginationOptions,
} from '../../middlewares/handlePagination';
import { MintingScheduleResponseConcise } from '../../models/MintingSchedule';
import BadRequestError from '../../utils/errors/BadRequestError';
import NotFoundError from '../../utils/errors/NotFoundError';
import UnauthenticatedError from '../../utils/errors/UnauthenticatedError';
import {
  getMyMintingSchedulesWithinPeriod,
  saveMintingScheduleById,
} from '../database/calendar';
import { groupMintingScheduleResponseByDay } from './utils';

type GetMyMintingScheduleReqQuery = {
  start: number;
  end?: number;
};

type GetMyMintingSchedulesRes = PaginatedResponse<
  Record<number, MintingScheduleResponseConcise[]>
>;

export const getMyMintingSchedulesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Parse request
    const u = req.user;
    if (!u) throw new UnauthenticatedError();
    const { start, end } = req.query as unknown as GetMyMintingScheduleReqQuery;
    const { limit, offset } = req.pg as PaginationOptions;
    // Prepare request
    const startDt = DateTime.fromMillis(start);
    const endDt = end ? DateTime.fromMillis(end) : startDt.plus({ month: 1 });

    // Query DB
    const { rows: mss, count } = await getMyMintingSchedulesWithinPeriod(
      startDt,
      endDt,
      u
    );

    // Prepare response
    const msrs = await Promise.all(mss.map((ms) => ms.toResponseJSON()));
    const data = groupMintingScheduleResponseByDay(msrs);
    const response: GetMyMintingSchedulesRes = createPgRes<typeof data>({
      limit,
      offset,
      count,
      data,
    });

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

type SaveMintingScheduleReqBody = {
  id: number;
};

export const saveMintingScheduleController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Parse request
    const u = req.user;
    if (!u) throw new UnauthenticatedError();
    const { id: mintingScheduleId } = req.body as SaveMintingScheduleReqBody;
    if (!mintingScheduleId) throw new BadRequestError();

    // Add minting schedule to calendar
    const ms = await saveMintingScheduleById(mintingScheduleId, u);
    if (!ms) {
      throw new NotFoundError();
    }

    // Prepare response
    const response = {
      success: true,
      data: await ms.toResponseJSON(),
    };

    // Send response
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
