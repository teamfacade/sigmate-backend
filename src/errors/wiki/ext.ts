import ServerError from '..';

type ErrorCode =
  | 'WIKI/EXT/IV_NAME'
  | 'WIKI/EXT/ER_COLLECTION_NOT_LOADED'
  | 'WIKI/EXT/ER_NFT_NOT_LOADED'
  | 'WIKI/EXT/ER_BLOCK_NOT_SELECTED'
  | 'WIKI/EXT/ER_COLLECTION_UNSET';

const defaultsMap: sigmate.Error.DefaultsMap<ErrorCode> = {
  'WIKI/EXT/IV_NAME': {
    message: 'Unsupported external data name',
  },
  'WIKI/EXT/ER_COLLECTION_NOT_LOADED': {
    message: 'Collection accessed before load',
  },
  'WIKI/EXT/ER_NFT_NOT_LOADED': {
    message: 'Nft accessed before load',
  },
  'WIKI/EXT/ER_BLOCK_NOT_SELECTED': {
    message: 'Block not selected',
  },
  'WIKI/EXT/ER_COLLECTION_UNSET': {
    message: 'Cannot reload collection. Assign a Collection instance first',
  },
};

export default class WikiExtError extends ServerError<ErrorCode> {
  constructor(options: sigmate.Error.Options<ErrorCode>) {
    super(ServerError.parseOptions('WikiExtError', options, defaultsMap));
  }
}
