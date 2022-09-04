import BcToken, { BcTokenCreationAttributes } from '../../models/BcToken';
import Collection, {
  CollectionCreationAttributes,
} from '../../models/Collection';
import CollectionDeployer from '../../models/CollectionDeployer';
import ApiError from '../../utils/errors/ApiError';
import SequelizeError from '../../utils/errors/SequelizeError';

export const getCollectionBySlug = async (slug: string) => {
  try {
    return await Collection.findOne({ where: { slug } });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const createCollection = async (
  collectionDTO: CollectionCreationAttributes
) => {
  try {
    return await Collection.create(collectionDTO);
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const setCollectionDeployerAddresses = async (
  collection: Collection | null,
  deployerAddresses: string[]
) => {
  if (!collection) throw new ApiError('ERR_DB');
  try {
    const collectionDeployers = (
      await Promise.all(
        deployerAddresses.map((da) =>
          CollectionDeployer.findOrCreate({
            where: { address: da, collection },
          })
        )
      )
    ).map((res) => res[0]);
    await collection.$set('collectionDeployers', collectionDeployers);
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const setCollectionPaymentTokens = async (
  collection: Collection,
  tokens: BcTokenCreationAttributes[]
) => {
  if (!collection) throw new ApiError('ERR_DB');
  try {
    const paymentTokens = (
      await Promise.all(
        tokens.map((pt) =>
          BcToken.findOrCreate({
            where: {
              name: pt.name,
              symbol: pt.symbol,
              address: pt.address,
            },
            defaults: pt,
          })
        )
      )
    ).map((res) => res[0]);

    await collection.$set('paymentTokens', paymentTokens);
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};
