import { Request, Response, NextFunction } from 'express';
import { DateTime } from 'luxon';
import {
  createPgRes,
  PaginatedResponse,
  PaginationOptions,
} from '../../middlewares/handlePagination';
import Collection from '../../models/Collection';
import {
  MintingScheduleAttributes,
  MintingScheduleResponse,
} from '../../models/MintingSchedule';
import ApiError from '../../utils/errors/ApiError';
import NotFoundError from '../../utils/errors/NotFoundError';
import UnauthenticatedError from '../../utils/errors/UnauthenticatedError';
import {
  createMintingSchedule,
  getMintingScheduleWithinPeriod,
  getMintingScheudleById,
  updateMintingScheduleById,
} from '../database/calendar';
import { getCollectionById } from '../database/collection';
import { groupMintingScheduleResponseByDay } from './utils';

type GetMintingScheduleReqQuery = {
  start: number; // Date.getTime()
  end?: number;
};

type GetMintingScheduleResponse = PaginatedResponse<
  Record<number, MintingScheduleResponse[]>
>;

export const getMintingSchedulesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Parse request
    const { start, end } = req.query as unknown as GetMintingScheduleReqQuery;
    const { limit, offset } = req.pg as PaginationOptions;
    const startDt = DateTime.fromMillis(start);
    const endDt = end ? DateTime.fromMillis(end) : startDt.plus({ month: 1 });
    const u = req.user || null;

    // Query DB
    const { count, rows } = await getMintingScheduleWithinPeriod(
      startDt,
      endDt
    );

    // Prepare response
    const msrs = await Promise.all(rows.map((ms) => ms.toResponseJSON(u)));
    const data = groupMintingScheduleResponseByDay(msrs);

    // Send response
    const response: GetMintingScheduleResponse = createPgRes<typeof data>({
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

type CreateMintingScheduleReqBody = {
  name: string;
  tier: number;
  mintingTime: string; // isISO8601
  mintingUrl?: string; // isURL
  description?: string;
  collection?: number; // collection id
  document?: number;
  mintingPrice?: string;
  mintingPriceSymbol?: string;
};

export const createMintingScheduleController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const u = req.user;
    if (!u) throw new UnauthenticatedError();
    const d = req.device;

    const {
      name,
      tier,
      mintingTime,
      mintingUrl,
      description,
      collection: collectionId,
      document: documentId,
      mintingPrice,
      mintingPriceSymbol,
    } = req.body as CreateMintingScheduleReqBody;

    // Check if collection exists

    let cl: Collection | null = null;
    if (collectionId) {
      cl = await getCollectionById(collectionId);
    } else if (documentId) {
      cl = await Collection.findOne({ where: { documentId } });
    }
    if (!cl) throw new NotFoundError();

    // Create the schedule
    const ms = await createMintingSchedule({
      name,
      tier,
      mintingTime: new Date(mintingTime),
      mintingUrl,
      description,
      collectionId: cl.id,
      mintingPrice,
      mintingPriceSymbol,
      createdBy: u,
      createdByDevice: d,
    });

    const response = {
      success: true,
      data: await ms.toResponseJSON(),
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

type UpdateMintingScheduleReqParams = { id: MintingScheduleAttributes['id'] };
type UpdateMintingScheduleReqBody = Partial<CreateMintingScheduleReqBody>;

type UpdateMintingScheduleRes = {
  success: boolean;
  data: MintingScheduleResponse;
};

export const updateMintingScheduleController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const u = req.user;
    if (!u) throw new UnauthenticatedError();
    const d = req.device;

    const { id } = req.params as unknown as UpdateMintingScheduleReqParams;
    const {
      name,
      tier,
      mintingTime,
      mintingUrl,
      description,
      collection: collectionId,
      mintingPrice,
      mintingPriceSymbol,
    } = req.body as UpdateMintingScheduleReqBody;

    if (collectionId) {
      const cl = await getCollectionById(collectionId);
      if (!cl) throw new NotFoundError();
    }

    const ms = await updateMintingScheduleById(id, {
      name,
      tier,
      mintingTime: mintingTime ? new Date(mintingTime) : undefined,
      mintingUrl,
      description,
      collectionId,
      mintingPrice,
      mintingPriceSymbol,
      updatedBy: u,
      updatedByDevice: d,
    });

    if (!ms) throw new ApiError('ERR_UPDATE_SCHEDULE_MINTING_FAILED');

    const response: UpdateMintingScheduleRes = {
      success: true,
      data: await ms.toResponseJSON(),
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

type GetMintingScheduleByIdReqParams = {
  id: number;
};

export const getMintingScheduleByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id: mintingScheduleId } =
      req.params as unknown as GetMintingScheduleByIdReqParams;

    const ms = await getMintingScheudleById(mintingScheduleId);
    if (!ms) throw new NotFoundError();
    const response = {
      success: true,
      data: await ms.toResponseJSON(),
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
