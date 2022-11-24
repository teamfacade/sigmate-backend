import { Request, Response, NextFunction } from 'express';
import { BcTokenRequest } from '../../models/BcToken';
import Collection, {
  CollectionAttributes,
  CollectionCreationDTO,
  CollectionResponse,
  CollectionUpdateDTO,
  OPENSEA_METADATA_UPDATE_PERIOD,
  OPENSEA_PRICE_UPDATE_PERIOD,
} from '../../models/Collection';
import { CollectionDeployerAttributes } from '../../models/CollectionDeployer';
import {
  CollectionCategoryAttributes,
  CollectionCategoryCreationDTO,
} from '../../models/CollectionCategory';
import { CollectionUtilityAttributes } from '../../models/CollectionUtility';
import Document, { DocumentAttributes } from '../../models/Document';
import ApiError from '../../utils/errors/ApiError';
import BadRequestError from '../../utils/errors/BadRequestError';
import NotFoundError from '../../utils/errors/NotFoundError';
import UnauthenticatedError from '../../utils/errors/UnauthenticatedError';
import { fetchCollectionBySlug } from '../3p/collection';
import {
  countCollectionByUtility,
  countCollectionUtilityInCategory,
  createCollectionCategory,
  createCollectionUtility,
  createCollectionWithTx,
  deleteCollectionBySlug,
  deleteCollectionCategory,
  deleteCollectionUtilityById,
  getCollectionBySlug,
  getCollectionByUser,
  getCollectionCategories,
  getCollectionCategoryById,
  getCollectionUtilitiesByCollectionCategoryId,
  updateCollectionBySlugWithTx,
  updateCollectionCategory,
  updateCollectionUtility,
} from '../database/collection';
import {
  auditWikiDocumentById,
  updateDocumentTextContent,
} from '../database/wiki/document';
import { createPgRes } from '../../middlewares/handlePagination';
import ConflictError from '../../utils/errors/ConflictError';
import { sendNewCollectionToSlack } from '../3p/slack';

type GetCollectionBySlugRequestQuery = {
  create?: boolean;
  update?: boolean;
};

type GetCollectionBySlugRequestParams = {
  slug: string;
};

type GetCollectionBySlugResponse = {
  success: boolean;
  collection: CollectionResponse;
};

export const getCollectionBySlugController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { create = false, update = true } =
      req.query as GetCollectionBySlugRequestQuery;
    const { slug } = req.params as GetCollectionBySlugRequestParams;
    let cl = await getCollectionBySlug(slug);

    // Should fetch fresh information from opensea
    let shouldFetch = false;
    const now = new Date().getTime();
    if (cl) {
      if (cl.openseaMetadataUpdatedAt) {
        // Check if metadata cache is stale
        const lastUpdatedAt = cl.openseaMetadataUpdatedAt.getTime();
        if (now - lastUpdatedAt > OPENSEA_METADATA_UPDATE_PERIOD) {
          shouldFetch = update;
        }
      } else {
        // Never updated before
        shouldFetch = update;
      }

      if (cl.openseaPriceUpdatedAt) {
        // Check if price cache is stale
        const lastUpdatedAt = cl.openseaPriceUpdatedAt.getTime();
        if (now - lastUpdatedAt > OPENSEA_PRICE_UPDATE_PERIOD) {
          shouldFetch = update;
        }
      } else {
        // Never updated before
        shouldFetch = update;
      }
    } else {
      // Not found in database.
      shouldFetch = create;
    }

    // Update DB with fresh information
    if (shouldFetch) {
      const device = req.device;
      const user = req.user || undefined;
      cl = await fetchCollectionBySlug(slug, device, user);
    }

    if (!cl) throw new NotFoundError();

    // Send response to client
    const response: GetCollectionBySlugResponse = {
      success: true,
      collection: await cl.toResponseJSON(),
    };
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// for admin page
export const getCollectionByUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const pg = req.pg;
    if (!pg) throw new BadRequestError();
    const { rows: cls, count } = await getCollectionByUser(pg);
    const clsRes = await Promise.all(cls.map((cl) => cl.toResponseJSON()));
    const pgRes = createPgRes({
      limit: pg.limit,
      offset: pg.offset,
      data: clsRes,
      count,
    });
    res.status(200).json(pgRes);
  } catch (error) {
    next(error);
  }
};

type UpdateCollectionByUserReqBody = Partial<
  Pick<
    CreateCollectionReqBody,
    | 'name'
    | 'description'
    | 'paymentTokens'
    | 'twitterHandle'
    | 'discordUrl'
    | 'websiteUrl'
    | 'imageUrl'
    | 'bannerImageUrl'
    | 'mintingPriceWl'
    | 'mintingPricePublic'
    | 'floorPrice'
    | 'marketplace'
    | 'category'
    | 'utility'
    | 'team'
    | 'history'
  >
>;

export const updateCollectionByUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const u = req.user;
    const d = req.device;
    if (!u) throw new UnauthenticatedError();
    if (!d) throw new ApiError('ERR_DEVICE');
    const { slug } = req.params;
    const collection = req.body as UpdateCollectionByUserReqBody;

    const auditWikiDocumentDTO = {
      document: {},
      collection: {
        name: collection?.name,
        description: collection?.description,
        paymentTokens: collection?.paymentTokens,
        twitterHandle: collection?.twitterHandle,
        discordUrl: collection?.discordUrl,
        websiteUrl: collection?.websiteUrl,
        imageUrl: collection?.imageUrl,
        bannerImageUrl: collection?.bannerImageUrl,
        mintingPriceWl: collection?.mintingPriceWl,
        mintingPricePublic: collection?.mintingPricePublic,
        floorPrice: collection?.floorPrice,
        marketplace: collection?.marketplace,
        category: collection?.category,
        utility: collection?.utility,
        team: collection?.team,
        history: collection?.history,
        infoConfirmedById: u.id,
        infoSource: 'admin',
      },
    };

    const cl = await getCollectionBySlug(slug);
    if (!cl) throw new NotFoundError();
    const document = await cl.$get('document', { attributes: ['id'] });
    if (!document) throw new NotFoundError();

    const doc = await auditWikiDocumentById(
      document.id,
      auditWikiDocumentDTO,
      u,
      d
    );
    const documentResponse = await doc.toResponseJSON();
    await updateDocumentTextContent(doc, documentResponse.blocks);

    res.status(200).json({
      success: true,
      document: await doc.toResponseJSON(),
    });
  } catch (error) {
    next(error);
  }
};

export interface CreateCollectionReqBody
  extends Pick<
    CollectionResponse,
    | 'contractAddress'
    | 'slug'
    | 'name'
    | 'description'
    | 'contractSchema'
    | 'email'
    | 'blogUrl'
    | 'redditUrl'
    | 'facebookUrl'
    | 'twitterHandle'
    | 'discordUrl'
    | 'telegramUrl'
    | 'bitcointalkUrl'
    | 'githubUrl'
    | 'wechatUrl'
    | 'linkedInUrl'
    | 'whitepaperUrl'
    | 'imageUrl'
    | 'bannerImageUrl'
    | 'mintingPriceWl'
    | 'mintingPricePublic'
    | 'floorPrice'
    | 'marketplace'
    | 'infoSource'
    | 'infoConfirmedBy'
    | 'infoConfirmedById'
  > {
  collectionDeployers?: CollectionDeployerAttributes['address'][];
  paymentTokens?: BcTokenRequest[];
  websiteUrl: string;
  document?: DocumentAttributes['id'];
  category?: CollectionCategoryAttributes['name'];
  utility?: CollectionUtilityAttributes['name'];
  team?: string;
  history?: string;
}

export const createCollectionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Parse request
    const u = req.user;
    const d = req.device;
    if (!u) throw new UnauthenticatedError();

    const body = req.body as CreateCollectionReqBody;
    const {
      slug,
      collectionDeployers = [],
      paymentTokens = [],
      document: documentId,
    } = body;

    // Validation
    // Check if document exists
    const document = await Document.findByPk(documentId);
    if (!document)
      throw new BadRequestError({
        validationErrors: [
          {
            location: 'body',
            param: 'document',
            value: document,
            msg: 'NOT_FOUND',
          },
        ],
      });

    // Check if slug already exists
    const alreadyExists = await Collection.findOne({
      where: { slug },
      attributes: ['id', 'slug', 'name', 'imageUrl'],
    });
    if (alreadyExists) {
      throw new BadRequestError({
        validationErrors: [
          {
            location: 'body',
            param: 'slug',
            value: slug,
            msg: 'ALREADY_EXISTS',
            data: {
              collection: alreadyExists,
            },
          },
        ],
      });
    }

    const collectionDTO: CollectionCreationDTO = {
      contractAddress: body.contractAddress,
      collectionDeployers,
      slug,
      name: body.name,
      description: body.description,
      paymentTokens,
      contractSchema: body.contractSchema,
      email: body.email,
      blogUrl: body.blogUrl,
      redditUrl: body.redditUrl,
      facebookUrl: body.facebookUrl,
      twitterHandle: body.twitterHandle,
      discordUrl: body.discordUrl,
      websiteUrl: body.websiteUrl,
      telegramUrl: body.telegramUrl,
      bitcointalkUrl: body.bitcointalkUrl,
      githubUrl: body.githubUrl,
      wechatUrl: body.wechatUrl,
      linkedInUrl: body.linkedInUrl,
      whitepaperUrl: body.whitepaperUrl,
      imageUrl: body.imageUrl,
      bannerImageUrl: body.bannerImageUrl,
      mintingPriceWl: body.mintingPriceWl,
      mintingPricePublic: body.mintingPricePublic,
      floorPrice: body.floorPrice,
      document,
      marketplace: body.marketplace,
      category: body.category,
      utility: body.utility,
      team: body.team,
      history: body.history,
      createdBy: u,
      createdByDevice: d,
      infoSource: body.infoSource,
    };

    const cl = await createCollectionWithTx(collectionDTO);
    res.status(201).json({
      success: true,
      collection: await cl.toResponseJSON(u),
    });

    if (cl) sendNewCollectionToSlack(cl);
  } catch (error) {
    next(error);
  }
};

type UpdateCollectionReqQuery = { slug: string };
export type UpdateCollectionReqBody = Partial<
  Omit<CreateCollectionReqBody, 'slug'>
>;

export const updateCollectionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Parse request
    const u = req.user;
    const d = req.device;
    if (!u) throw new UnauthenticatedError();
    if (!d) throw new ApiError('ERR_DEVICE');

    const { slug } = req.params as UpdateCollectionReqQuery;
    const body = req.body as UpdateCollectionReqBody;
    const { collectionDeployers, paymentTokens, document: documentId } = body;

    // Validation
    // Check if document exists
    const document = documentId
      ? (await Document.findByPk(documentId)) || undefined
      : undefined;
    if (documentId && !document) {
      throw new BadRequestError({
        validationErrors: [
          {
            location: 'body',
            param: 'document',
            value: document,
            msg: 'NOT_FOUND',
          },
        ],
      });
    }

    const collectionDTO: CollectionUpdateDTO = {
      contractAddress: body.contractAddress,
      collectionDeployers,
      name: body.name,
      description: body.description,
      paymentTokens,
      contractSchema: body.contractSchema,
      email: body.email,
      blogUrl: body.blogUrl,
      redditUrl: body.redditUrl,
      facebookUrl: body.facebookUrl,
      twitterHandle: body.twitterHandle,
      discordUrl: body.discordUrl,
      websiteUrl: body.websiteUrl,
      telegramUrl: body.telegramUrl,
      bitcointalkUrl: body.bitcointalkUrl,
      githubUrl: body.githubUrl,
      wechatUrl: body.wechatUrl,
      linkedInUrl: body.linkedInUrl,
      whitepaperUrl: body.whitepaperUrl,
      imageUrl: body.imageUrl,
      bannerImageUrl: body.bannerImageUrl,
      mintingPriceWl: body.mintingPriceWl,
      mintingPricePublic: body.mintingPricePublic,
      floorPrice: body.floorPrice,
      document,
      marketplace: body.marketplace,
      category: body.category,
      utility: body.utility,
      team: body.team,
      history: body.history,
      updatedBy: u,
      updatedByDevice: d,
    };

    const cl = await updateCollectionBySlugWithTx(slug, collectionDTO);
    res.status(200).json({
      success: true,
      collection: await cl.toResponseJSON(),
    });
  } catch (error) {
    next(error);
  }
};

type DeleteCollectionReqParams = {
  slug: CollectionAttributes['slug'];
};

export const deleteCollectionController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const u = req.user;
    if (!u) throw new UnauthenticatedError();
    const d = req.device;
    const { slug } = req.params as DeleteCollectionReqParams;
    await deleteCollectionBySlug({
      slug,
      deletedBy: u,
      deletedByDevice: d,
    });
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

type GetCollectionCategoriesReqQuery = {
  q?: string;
};

export const getCollectionCategoriesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { q: query } = req.query as GetCollectionCategoriesReqQuery;
    const ccs = await getCollectionCategories(query);
    res.status(200).json({
      success: true,
      query,
      categories: ccs,
    });
  } catch (error) {
    next(error);
  }
};

type CreateCollectionCategoryReqBody = Pick<
  CollectionCategoryCreationDTO,
  'name'
>;

export const createCollectionCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Parse request
    const u = req.user;
    const d = req.device;
    if (!u) throw new UnauthenticatedError();
    const { name } = req.body as CreateCollectionCategoryReqBody;

    const cc = await createCollectionCategory({
      name,
      createdBy: u,
      createdByDevice: d,
    });

    res.status(201).json({
      success: true,
      category: cc.toResponseJSON(),
    });
  } catch (error) {
    next(error);
  }
};

type UpdateCollectionCategoryReqParams = {
  cid: CollectionCategoryAttributes['id'];
};

type UpdateCollectionCategoryReqBody = Pick<
  CollectionCategoryCreationDTO,
  'name'
>;

export const updateCollectionCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const u = req.user;
    if (!u) throw new UnauthenticatedError();
    const d = req.device;
    const { cid: id } =
      req.params as unknown as UpdateCollectionCategoryReqParams;
    const { name } = req.body as UpdateCollectionCategoryReqBody;

    const cc = await updateCollectionCategory({
      id,
      name,
      updatedBy: u,
      updatedByDevice: d,
    });

    res.status(200).json({
      success: true,
      category: cc.toResponseJSON(),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCollectionCategoryController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.cid as unknown as number;

    // Does category have any utilities?
    const uCount = await countCollectionUtilityInCategory(id);
    if (uCount) {
      throw new ConflictError('ERR_DELETE_CATEGORY_UTILITIES_STILL_EXIST');
    }

    // If not, proceed to delete
    const deleted = await deleteCollectionCategory(id);
    if (deleted) {
      res.status(200).json({ success: true });
    } else {
      // Nothing deleted. Category must not exist
      throw new NotFoundError();
    }
  } catch (error) {
    next(error);
  }
};

type GetCollectionUtilitiesReqQuery = {
  q?: string;
};

type GetCollectionUtilitiesReqParams = {
  cid: CollectionCategoryAttributes['id'];
};

export const getCollectionUtilitiesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { q: query } = req.query as GetCollectionUtilitiesReqQuery;
    const { cid } = req.params as unknown as GetCollectionUtilitiesReqParams;

    const cus = await getCollectionUtilitiesByCollectionCategoryId(cid, query);

    res.status(200).json({
      success: true,
      utilities: cus,
    });
  } catch (error) {
    next(error);
  }
};

type CreateCollectionUtilitiesReqParams = {
  cid: CollectionCategoryAttributes['id'];
};

type CreateCollectionUtilitiesReqBody = {
  name: CollectionUtilityAttributes['name'];
};

export const createCollectionUtilityController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const u = req.user;
    if (!u) throw new UnauthenticatedError();
    const d = req.device;
    const { cid } = req.params as unknown as CreateCollectionUtilitiesReqParams;
    if (!cid) throw new BadRequestError();
    const { name } = req.body as CreateCollectionUtilitiesReqBody;
    if (!name) throw new BadRequestError();

    const cu = await createCollectionUtility({
      name,
      createdById: u?.id,
      createdByDeviceId: d?.id,
      collectionCategoryId: cid,
    });

    res.status(201).json({ success: true, utility: await cu.toResponseJSON() });
  } catch (error) {
    next(error);
  }
};

type UpdateCollectionUtilitiesReqParams = {
  cid: CollectionCategoryAttributes['id'];
  uid: CollectionUtilityAttributes['id'];
};

type UpdateCollectionUtilitiesReqBody = {
  name: CollectionUtilityAttributes['name'];
};

export const updateCollectionUtilityController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const u = req.user;
    if (!u) throw new UnauthenticatedError();
    const d = req.device;
    const { cid, uid } =
      req.params as unknown as UpdateCollectionUtilitiesReqParams;
    const cc = await getCollectionCategoryById(cid);
    if (!cc) throw new NotFoundError();
    const { name } = req.body as UpdateCollectionUtilitiesReqBody;
    const cu = await updateCollectionUtility({
      id: uid,
      name,
      updatedBy: u,
      updatedByDevice: d,
    });

    res.status(200).json({
      success: true,
      utility: await cu.toResponseJSON(['category']),
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCollectionUtilityController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const uid = req.params.uid as unknown as number;
    const cCount = await countCollectionByUtility(uid);
    if (cCount) {
      // Delete all collections that use this utility first
      throw new ConflictError('ERR_DELETE_UTILITY_COLLECTIONS_STILL_EXIST');
    }

    const deleted = await deleteCollectionUtilityById(uid);
    if (deleted) {
      res.status(200).json({ success: true });
    } else {
      // Nothing was deleted. Utility must not exist.
      throw new NotFoundError();
    }
  } catch (error) {
    next(error);
  }
};
