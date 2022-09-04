import axios, { AxiosError } from 'axios';
import { BcTokenCreationAttributes } from '../../models/BcToken';
import {
  CollectionAttributes,
  CollectionCreationAttributes,
} from '../../models/Collection';
import ApiError from '../../utils/errors/ApiError';
import NotFoundError from '../../utils/errors/NotFoundError';
import {
  createCollection,
  getCollectionBySlug,
  setCollectionDeployerAddresses,
  setCollectionPaymentTokens,
} from '../database/collection';
import { OpenseaCollectionResponse, OPENSEA_BASE_URL } from './opensea';

/**
 * Fetch information about a collection from Opensea API
 * @param collectionSlug Opensea collection slug
 * @returns Whether fetch was successful
 */
export const fetchCollectionBySlug = async (collectionSlug: string) => {
  // const collectionSlug = collection.slug;
  const collectionDTO: Partial<CollectionAttributes> = {};
  const deployerAddresses: string[] = [];
  const paymentTokens: BcTokenCreationAttributes[] = [];

  // Opensea: Retrieve a collection
  try {
    const res = await axios.get<OpenseaCollectionResponse>(
      `${OPENSEA_BASE_URL}/collection/${collectionSlug}`
    );
    if (!res.data?.collection) throw new NotFoundError();
    const c = res.data.collection;

    // Prepare data from Opensea
    collectionDTO.slug = c.slug;
    c.primary_asset_contracts[0].address &&
      (collectionDTO.contractAddress = c.primary_asset_contracts[0].address);
    collectionDTO.name = c.name;
    c.description && (collectionDTO.description = c.description);
    collectionDTO.contractSchema = c.primary_asset_contracts[0].schema_name;
    c.twitter_username && (collectionDTO.twitterHandle = c.twitter_username);
    c.discord_url && (collectionDTO.discordUrl = c.discord_url);
    c.external_url && (collectionDTO.websiteUrl = c.external_url);
    c.telegram_url && (collectionDTO.telegramUrl = c.telegram_url);
    c.image_url && (collectionDTO.imageUrl = c.image_url);
    c.banner_image_url && (collectionDTO.bannerImageUrl = c.banner_image_url);

    deployerAddresses.concat(c.editors);
    paymentTokens.concat(
      c.payment_tokens.map((pt) => {
        return {
          name: pt.name,
          symbol: pt.symbol,
          address: pt.address,
          imageUrl: pt.image_url,
          decimals: pt.decimals,
        };
      })
    );
  } catch (error) {
    const e = error as unknown as AxiosError;
    if (e.response) {
      // Server responded with non 2xx status code
      const { status } = e.response;
      if (status === 404) throw new NotFoundError();
      // TODO handle too many requests error
      // if (status === 429)
    } else if (e.request) {
      // Request was made but no response
      throw new NotFoundError();
    } else {
      // Request failed
      throw new ApiError('ERR_COLLECTION_UPDATE_OPENSEA_UNKNOWN');
    }
    throw new ApiError('ERR_COLLECTION_UPDATE_OPENSEA');
  }

  // Record update time
  collectionDTO.openseaUpdatedAt = new Date();

  // Collection
  let collection = await getCollectionBySlug(collectionSlug);
  if (collection) {
    await collection.update(collectionDTO);
  } else {
    collection = await createCollection(
      collectionDTO as CollectionCreationAttributes
    );
  }

  // Set deployer addresses
  await setCollectionDeployerAddresses(collection, deployerAddresses);

  // Set payment tokens
  await setCollectionPaymentTokens(collection, paymentTokens);

  return true;
};
