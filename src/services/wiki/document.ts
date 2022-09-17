import { Request, Response, NextFunction } from 'express';
import Collection from '../../models/Collection';
import Document, {
  DocumentAttributes,
  DocumentResponse,
} from '../../models/Document';
import Nft from '../../models/Nft';
import ApiError from '../../utils/errors/ApiError';
import BadRequestError from '../../utils/errors/BadRequestError';
import UnauthenticatedError from '../../utils/errors/UnauthenticatedError';
import { fetchCollectionBySlug } from '../3p/collection';
import {
  createCollectionWithTx,
  getCollectionBySlug,
} from '../database/collection';
import { createNft, getNftByAdressAndId } from '../database/nft';
import {
  createWikiDocument,
  getCollectionDocument,
} from '../database/wiki/document';

type CreateWikiDocumentReqBody = {
  title: string;
  parent: DocumentAttributes['id'];
  collection?: {
    slug: string;
    marketplace: string;
  };
  nft?: {
    contractAddress: string;
    tokenId: number;
  };
};

type CreateWikiDocumentFailRes = {
  success: false;
  msg: string;
  document?: {
    id: number;
    title: string;
  };
};

type CreateWikiResSuccess = {
  success: true;
  document: DocumentResponse;
};

export const createWikiDocumentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const u = req.user;
    if (!u) throw new UnauthenticatedError();
    const d = req.device;
    const {
      title,
      parent: parentId,
      collection: collectionReq,
      nft: nftReq,
    } = req.body as CreateWikiDocumentReqBody;

    let doc: Document | null = null;
    let cl: Collection | null = null;
    let nft: Nft | null = null;

    if (collectionReq) {
      // Document about NFT Collection
      if (!collectionReq.slug) throw new BadRequestError();

      // Look if the collection has already been created
      cl = await getCollectionBySlug(collectionReq.slug);

      if (cl) {
        // Check if a document about this collection already exists
        doc = await getCollectionDocument(cl);

        if (doc) {
          // Document already exists. Stop and send a fail response
          const response: CreateWikiDocumentFailRes = {
            success: false,
            msg: 'ERR_DOCUMENT_ALREADY_EXISTS',
            document: {
              id: doc.id,
              title: doc.title,
            },
          };

          res.status(409).json(response);
          return;
        }
      }

      // Try the Opensea API
      // Create a collection if not exists, and update if already exists
      cl = await fetchCollectionBySlug(collectionReq.slug, d, u);

      if (!cl) {
        // If not found on Opensea, create an empty collection
        cl = await createCollectionWithTx({
          slug: collectionReq.slug,
          name: collectionReq.slug,
          contractSchema: 'ERC721',
          collectionDeployers: [],
          paymentTokens: [],
          marketplace: collectionReq.marketplace,
          createdBy: u,
          createdByDevice: d,
        });
      }

      // Something went wrong
      if (!cl) {
        throw new ApiError('ERR_WIKI_DOCUMENT_CREATE_COLLECTION_CREATE_FAILED');
      }
    }

    if (nftReq) {
      // Document about NFT (individual token)
      if (!nftReq.contractAddress || !nftReq.tokenId)
        throw new BadRequestError();

      // Check if the NFT already exists
      nft = await getNftByAdressAndId(nftReq.contractAddress, nftReq.tokenId);
      if (!nft) {
        // NFT must be created first
        nft = await createNft({
          collectionId: cl?.id || undefined,
          contractAddress: nftReq.contractAddress,
          tokenId: nftReq.tokenId,
          createdBy: u,
          createdByDevice: d,
        });
      }

      // Something went wrong
      if (!nft) {
        throw new ApiError('ERR_WIKI_DOCUMENT_CREATE_NFT_CREATE_FAILED');
      }
    }

    // Create the document and associate the collection with it
    doc = await createWikiDocument({
      title,
      parentId,
      collection: collectionReq ? cl || undefined : undefined,
      nft: nftReq ? nft || undefined : undefined,
      createdBy: u,
      createdByDevice: d,
    });

    const response: CreateWikiResSuccess = {
      success: true,
      document: await doc.toResponseJSON(),
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};
