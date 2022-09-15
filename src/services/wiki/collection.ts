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
  createCollectionCategory,
  createCollectionWithTx,
  deleteCollectionBySlug,
  getCollectionBySlug,
  getCollectionCategories,
  updateCollectionBySlugWithTx,
} from '../database/collection';

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

interface CreateCollectionReqBody
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
    };

    const cl = await createCollectionWithTx(collectionDTO);
    res.status(201).json({
      success: true,
      collection: await cl.toResponseJSON(u),
    });
  } catch (error) {
    next(error);
  }
};

type UpdateCollectionReqQuery = { slug: string };
type UpdateCollectionReqBody = Partial<Omit<CreateCollectionReqBody, 'slug'>>;

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
