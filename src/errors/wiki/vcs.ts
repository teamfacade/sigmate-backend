import ServerError from '..';

type ErrorCode =
  | 'WIKI/VCS/ER_VERSION_ALL'
  | 'WIKI/VCS/ER_ID'
  | 'WIKI/VCS/ER_NOT_SELECTED'
  | 'WIKI/VCS/ER_LATEST_NOT_LOADED'
  | 'WIKI/VCS/ER_VERSION';

const defaultsMap: sigmate.Error.DefaultsMap<ErrorCode> = {
  'WIKI/VCS/ER_VERSION_ALL': {
    message: 'Unexpected VERSION_ALL in version argument',
  },
  'WIKI/VCS/ER_ID': {
    message: 'Item ID mismatch',
  },
  'WIKI/VCS/ER_NOT_SELECTED': {
    message: 'Item version not selected',
  },
  'WIKI/VCS/ER_LATEST_NOT_LOADED': {
    message: 'Latest version not loaded',
  },
  'WIKI/VCS/ER_VERSION': {
    message: 'Version not specified or invalid',
  },
};

export default class WikiVCSError extends ServerError<ErrorCode> {
  constructor(options: sigmate.Error.Options<ErrorCode>) {
    super(ServerError.parseOptions('ItemVCSError', options, defaultsMap));
  }
}
