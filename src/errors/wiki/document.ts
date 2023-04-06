import ServerError from '..';

type ErrorCode =
  | 'WIKI/DOC/IV_PK'
  | 'WIKI/DOC/IV_SK'
  | 'WIKI/DOC/IV_TYPE'
  | 'WIKI/DOC/IV_ITEM'
  | 'WIKI/DOC/ER_ITEM'
  | 'WIKI/DOC/ER_ID'
  | 'WIKI/DOC/ER_CACHE_NOT_LATEST'
  | 'WIKI/DOC/NF_LATEST'
  | 'WIKI/DOC/NF_VERSION'
  | 'WIKI/DOC/ER_BUILD_NF_BLOCK'
  | 'WIKI/DOC/CREATE/IV_REQUEST';

const defaultsMap: sigmate.Error.DefaultsMap<ErrorCode> = {
  'WIKI/DOC/IV_PK': {
    message: 'Document item partition key is corrupt. Document ID not found',
  },
  'WIKI/DOC/IV_SK': {
    message: 'Document item sort key is corrupt. Document version ID not found',
  },
  'WIKI/DOC/IV_TYPE': {
    message: 'Invalid document type',
  },
  'WIKI/DOC/IV_ITEM': {
    message: 'Document item is invalid',
    httpCode: 400,
    logLevel: 'verbose',
  },
  'WIKI/DOC/ER_ITEM': {
    message: 'Document item from database is corrupt',
  },
  'WIKI/DOC/ER_ID': {
    message:
      'Document ID mismatch. Cannot set version with a data from a different document',
  },
  'WIKI/DOC/ER_CACHE_NOT_LATEST': {
    message: 'Cannot create latest version cache of a non-latest version',
  },
  'WIKI/DOC/NF_LATEST': {
    message: 'Latest version not found',
    httpCode: 404,
    logLevel: 'verbose',
  },
  'WIKI/DOC/NF_VERSION': {
    message: 'Specified document version not found',
    httpCode: 404,
    logLevel: 'verbose',
  },
  'WIKI/DOC/ER_BUILD_NF_BLOCK': {
    message: 'Document build failed. Block not loaded',
  },
  'WIKI/DOC/CREATE/IV_REQUEST': {
    message: 'Invalid document create request',
    httpCode: 400,
    logLevel: 'verbose',
  },
};

export default class WikiDocumentError extends ServerError<ErrorCode> {
  constructor(options: sigmate.Error.Options<ErrorCode>) {
    super(ServerError.parseOptions('WikiDocumentError', options, defaultsMap));
  }
}
