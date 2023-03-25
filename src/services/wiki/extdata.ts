import Service from '..';

export type ExternalDataName =
  | 'ExtClDiscord'
  | 'ExtClTwitter'
  | 'ExtClWebsite'
  | 'ExtClFloorPrice'
  | 'ExtClMintingPrices'
  | 'ExtClChains'
  | 'ExtClMarketplaces'
  | 'ExtClCategory';

/**
 * Fetching/Caching Wiki document content that is stored in SQL database, or 3rd party APIs
 */
export default class WikiExtDataService extends Service {
  constructor() {
    super('WikiExtData');
  }
}

export const wikiExtData = new WikiExtDataService();
