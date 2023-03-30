import ServerError from '..';

type ErrorCode =
  | 'WIKI/BLOCK/IV_KI_NAME_CHANGE'
  | 'WIKI/BLOCK/IV_PK'
  | 'WIKI/BLOCK/IV_SK'
  | 'WIKI/BLOCK/IV_SK_ID'
  | 'WIKI/BLOCK/IV_SK_VERSION'
  | 'WIKI/BLOCK/IV_ITEM'
  | 'WIKI/BLOCK/IV_KI_NAME'
  | 'WIKI/BLOCK/NF_LATEST'
  | 'WIKI/BLOCK/NF_VERSION'
  | 'WIKI/BLOCK/NF'
  | 'WIKI/BLOCK/IV_DTO'
  | 'WIKI/BLOCK/ER_BUILD_ID'
  | 'WIKI/BLOCK/ER_BUILD_VERSION'
  | 'WIKI/BLOCK/ER_BUILD_DOC_VERSION'
  | 'WIKI/BLOCK/ER_BUILD_NF_STRUCT'
  | 'WIKI/BLOCK/ER_BUILD_NF_EXT_NEVER_CACHED';

const defaultsMap: sigmate.Error.DefaultsMap<ErrorCode> = {
  'WIKI/BLOCK/IV_KI_NAME_CHANGE': {
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
  'WIKI/BLOCK/IV_KI_NAME': {
    message: 'Unsupported key info name',
    httpCode: 400,
    logLevel: 'verbose',
  },
  'WIKI/BLOCK/NF_LATEST': {
    message: 'Latest version of block not loaded.',
  },
  'WIKI/BLOCK/NF_VERSION': {
    message: 'Block version not found.',
    httpCode: 404,
    logLevel: 'verbose',
  },
  'WIKI/BLOCK/NF': {
    message: 'Block does not exist',
    httpCode: 404,
    logLevel: 'warn',
  },
  'WIKI/BLOCK/IV_DTO': {
    message: 'Block data is invalid',
    httpCode: 400,
    logLevel: 'verbose',
  },
  'WIKI/BLOCK/ER_BUILD_ID': {
    message: 'Block build failed. Block ID mismatch',
  },
  'WIKI/BLOCK/ER_BUILD_VERSION': {
    message: 'Block build failed. Version ID mismatch',
  },
  'WIKI/BLOCK/ER_BUILD_DOC_VERSION': {
    message: 'Block build failed. Document Version ID mismatch',
  },
  'WIKI/BLOCK/ER_BUILD_NF_STRUCT': {
    message: 'Block build failed. No structure provided',
  },
  'WIKI/BLOCK/ER_BUILD_NF_EXT_NEVER_CACHED': {
    message: 'ExtData not provided for a block that was never cached',
  },
};

export default class WikiBlockError extends ServerError<ErrorCode> {
  constructor(options: sigmate.Error.Options<ErrorCode>) {
    super(ServerError.parseOptions('WikiBlockError', options, defaultsMap));
  }
}
