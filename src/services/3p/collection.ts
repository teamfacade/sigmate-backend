import axios, { AxiosError } from 'axios';
import { BcTokenCreationAttributes } from '../../models/BcToken';
import {
  CollectionCreationDTO,
  CollectionUpdateDTO,
} from '../../models/Collection';
import { CollectionDeployerAttributes } from '../../models/CollectionDeployer';
import User from '../../models/User';
import UserDevice from '../../models/UserDevice';
import ApiError from '../../utils/errors/ApiError';
import UnauthenticatedError from '../../utils/errors/UnauthenticatedError';
import {
  createCollectionWithTx,
  getCollectionBySlug,
  updateCollectionBySlugWithTx,
} from '../database/collection';
import { OpenseaCollectionResponse, OPENSEA_BASE_URL } from './opensea';

/**
 * Fetch information about a collection from Opensea API
 * @param collectionSlug Opensea collection slug
 * @returns Whether fetch was successful
 */
export const fetchCollectionBySlug = async (
  collectionSlug: string,
  device: UserDevice | undefined,
  user: User | undefined = undefined
) => {
  // Collection
  let collection = await getCollectionBySlug(collectionSlug);

  // To create a collection in the database, user must be authenticated
  if (!collection && !user) throw new UnauthenticatedError();

  // Make req to Opensea API: Retrieve a collection
  let c: OpenseaCollectionResponse['collection'];
  try {
    const res = await axios.get<OpenseaCollectionResponse>(
      `${OPENSEA_BASE_URL}/collection/${collectionSlug}`
    );
    if (!res.data?.collection) return null;
    c = res.data.collection;
  } catch (error) {
    const e = error as unknown as AxiosError;
    if (e.response) {
      // Server responded with non 2xx status code
      const { status } = e.response;
      if (status === 404) return null;
      // TODO handle too many requests error
      // if (status === 429)
    } else if (e.request) {
      // Request was made but no response
      return null;
    } else {
      // Request failed
      throw new ApiError('ERR_COLLECTION_UPDATE_OPENSEA_UNKNOWN');
    }
    throw new ApiError('ERR_COLLECTION_UPDATE_OPENSEA');
  }

  // Prepare collection deployers
  const collectionDeployers: CollectionDeployerAttributes['address'][] =
    c.editors
      ?.map((e) => {
        if (typeof e !== 'string') return '';
        return e;
      })
      .filter((e) => e !== '') || [];

  // Prepare payment tokens
  const paymentTokens: BcTokenCreationAttributes[] =
    c.payment_tokens
      ?.map((pt) => {
        return {
          name: pt?.name || '',
          symbol: pt?.symbol || '',
          address: pt?.address || '',
          imageUrl: pt?.image_url || '',
          decimals: pt?.decimals || 0,
        };
      })
      .filter((pt) => pt.symbol !== '') || [];

  // Get floor price and store as string
  // Convert to string for ccurate storage of floating points
  const fp = c.stats.floor_price;
  const floorPrice = typeof fp === 'number' ? fp.toString() : fp;

  // Since we are fetching from Opensea API
  const marketplace = 'Opensea';

  // Record update time
  const now = new Date();

  // Finally, prepare DTO
  const collectionDTO: Omit<
    CollectionCreationDTO,
    'createdBy' | 'createdByDevice'
  > = {
    slug: c.slug,
    contractAddress: c.primary_asset_contracts[0].address,
    name: c.name,
    description: c.description || undefined,
    contractSchema: c.primary_asset_contracts[0].schema_name,
    twitterHandle: c.twitter_username || undefined,
    discordUrl: c.discord_url || undefined,
    websiteUrl: c.external_url || undefined,
    telegramUrl: c.telegram_url || undefined,
    imageUrl: c.image_url || undefined,
    bannerImageUrl: c.banner_image_url || undefined,
    collectionDeployers,
    paymentTokens,
    floorPrice,
    marketplace,
    openseaMetadataUpdatedAt: now,
    openseaPriceUpdatedAt: now,
  };

  if (collection) {
    // Update the collection
    const collectionUpdateDTO: CollectionUpdateDTO = {
      ...collectionDTO,
      updatedByDevice: device,
      updatedBy: user,
    };
    collection = await updateCollectionBySlugWithTx(
      collectionSlug,
      collectionUpdateDTO
    );
  } else {
    // Create new collection
    // Must be authenticated connection
    if (!user) return null;
    const collectionCreationDTO: CollectionCreationDTO = {
      ...collectionDTO,
      createdByDevice: device,
      createdBy: user,
    };
    collection = await createCollectionWithTx(collectionCreationDTO);
  }

  return collection;
};
