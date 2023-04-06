import ServerError from '..';

type ErrorCode =
  | 'WIKI/EXT/IV_NAME'
  | 'WIKI/EXT/IV_KI_NAME'
  | 'WIKI/EXT/ER_COLLECTION_NOT_LOADED'
  | 'WIKI/EXT/ER_NFT_NOT_LOADED'
  | 'WIKI/EXT/ER_BLOCK_NOT_SELECTED'
  | 'WIKI/EXT/ER_EXPECTED_NOT_LOADED';

const defaultsMap: sigmate.Error.DefaultsMap<ErrorCode> = {
  'WIKI/EXT/IV_NAME': {
    message: 'Unsupported external data name',
  },
  'WIKI/EXT/IV_KI_NAME': {
    message: 'Invalid KeyInfo name',
    httpCode: 400,
    logLevel: 'verbose',
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
  'WIKI/EXT/ER_EXPECTED_NOT_LOADED': {
    message: 'Expected data to be loaded but not found',
  },
};

export default class WikiExtError extends ServerError<ErrorCode> {
  constructor(options: sigmate.Error.Options<ErrorCode>) {
    super(ServerError.parseOptions('WikiExtError', options, defaultsMap));
  }
}
