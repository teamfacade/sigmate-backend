import ServerError from '..';

type ErrorCode =
  | 'WIKI/BLOCK/IV_KEYINFO_NAME_CHANGE'
  | 'WIKI/BLOCK/IV_PK'
  | 'WIKI/BLOCK/IV_SK'
  | 'WIKI/BLOCK/IV_SK_ID'
  | 'WIKI/BLOCK/IV_SK_VERSION'
  | 'WIKI/BLOCK/IV_ITEM'
  | 'WIKI/BLOCK/NF_LATEST'
  | 'WIKI/BLOCK/NF_VERSION'
  | 'WIKI/BLOCK/IV_DTO'
  | 'WIKI/BLOCK/ER_ID';

const defaultsMap: sigmate.Error.DefaultsMap<ErrorCode> = {
  'WIKI/BLOCK/IV_KEYINFO_NAME_CHANGE': {
    message:
      'KeyInfo "name" attribute is immutable. Re-create the block if change is necessary',
    httpCode: 400,
    logLevel: 'verbose',
  },
  'WIKI/BLOCK/IV_PK': {
    message: 'Block item partition key is corrupt. Document ID not found',
  },
  'WIKI/BLOCK/IV_SK': {
    message: 'Block item sort key is corrupt. Block ID and version not found',
  },
  'WIKI/BLOCK/IV_SK_ID': {
    message: 'Block item sort key is corrupt. Block ID not found',
  },
  'WIKI/BLOCK/IV_SK_VERSION': {
    message: 'Block item sort key is corrupt. Block version not found',
  },
  'WIKI/BLOCK/IV_ITEM': {
    message: 'Block item from DB is corrupted. Required attributes missing',
  },
  'WIKI/BLOCK/NF_LATEST': {
    message: 'Latest version of block not loaded.',
  },
  'WIKI/BLOCK/NF_VERSION': {
    message: 'Block version not found.',
    httpCode: 404,
    logLevel: 'verbose',
  },
  'WIKI/BLOCK/IV_DTO': {
    message: 'Block data is invalid',
    httpCode: 400,
    logLevel: 'verbose',
  },
  'WIKI/BLOCK/ER_ID': {
    message:
      'Unexpected block ID. Cannot set version with data of a different block',
  },
};

export default class WikiBlockError extends ServerError<ErrorCode> {
  constructor(options: sigmate.Error.Options<ErrorCode>) {
    super(ServerError.parseOptions('WikiBlockError', options, defaultsMap));
  }
}
