import Nft, { NftCreationAttributes } from '../../models/Nft';
import Collection from '../../models/Collection';
import ApiError from '../../utils/errors/ApiError';
import SequelizeError from '../../utils/errors/SequelizeError';

export const getNftsByCollection = async (collection: Collection | null) => {
  if (!collection) throw new ApiError('ERR_DB');
  try {
    return await Nft.findAll({ where: { collection } });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const createNft = async (nftDTO: NftCreationAttributes) => {
  try {
    return await Nft.create(nftDTO);
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};
