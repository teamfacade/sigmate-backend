import { forEach, mapValues } from 'lodash';
import { DateTime, DurationLike } from 'luxon';
import { Includeable } from 'sequelize/types';
import BlockVersion from '../../dynamoose/models/wiki/BlockVersion';
import { WikiKey } from '../../dynamoose/schemas/wiki';
import WikiExtError from '../../errors/wiki/ext';
import {
  Collection,
  CollectionAttribs,
} from '../../models/chain/Collection.model';
import { Nft, NftAttribs } from '../../models/chain/Nft.model';
import { ActionArgs, ActionMethod } from '../../utils/action';
import { WikiBlock } from './block';
import { WikiDocument } from './document';

export type ExtDataName =
  | 'ExtClDiscord'
  | 'ExtClTwitter'
  | 'ExtClTelegram'
  | 'ExtClWebsite'
  | 'ExtClFloorPrice'
  | 'ExtClMintingPrices'
  | 'ExtClChains'
  | 'ExtClMarketplaces'
  | 'ExtClCategory';

type ExtDataOptions = {
  collection?: Collection | null;
  collectionId?: CollectionAttribs['id'];
  nft?: Nft | null;
  nftId?: NftAttribs['id'];
};

type BlockExtDTO<
  T extends sigmate.Wiki.BlockExtCache = sigmate.Wiki.BlockExtCache
> = sigmate.Wiki.BlockExtDTO<T>;

/**
 * Fetching/Caching Wiki document content that is stored externally in SQL database, or 3rd party APIs
 */
export default class WikiExt {
  /** Expire the cached data in DynamoDB after this time has elapsed */
  static expiry: Map<string, DurationLike> = new Map(
    Object.entries({
      ExtClDiscord: { day: 1 },
      ExtClTwitter: { day: 1 },
      ExtClTelegram: { day: 1 },
      ExtClWebsite: { day: 1 },
      ExtClChains: { day: 1 },
      ExtClMarketplaces: { day: 1 },
      ExtClCategory: { day: 1 },
      ExtClFloorPrice: { minutes: 10 },
      ExtClMintingPrices: { minutes: 30 },
    })
  );

  static getPlaceholder(name: string) {
    return `:__${name}__:`;
  }

  static isExpired(name: string, ext: BlockExtDTO) {
    const expiresAfter = this.expiry.get(name);
    if (!expiresAfter) throw new WikiExtError('WIKI/EXT/IV_NAME');
    const { cachedAt } = ext;
    const now = DateTime.now();
    if (!cachedAt) return true;
    return now > cachedAt.plus(expiresAfter);
  }

  static neverCached(ext: BlockExtDTO) {
    return ext.cachedAt === null;
  }

  private __collection?: Collection | null;
  private collectionCachedAt: DateTime | null;
  public set collectionId(value: CollectionAttribs['id'] | undefined) {
    if (value) {
      this.__collection = Collection.build({ id: value, name: '', slug: '' });
    } else {
      this.__collection = null;
      this.collectionCachedAt = DateTime.now();
    }
  }

  public get collection() {
    if (this.__collection === undefined) {
      throw new WikiExtError('WIKI/EXT/ER_COLLECTION_NOT_LOADED');
    }
    return this.__collection;
  }
  public set collection(value) {
    this.__collection = value;
    this.collectionCachedAt = DateTime.now();
  }

  __nft?: Nft | null;
  public get nft() {
    if (this.__nft === undefined) {
      throw new WikiExtError('WIKI/EXT/ER_NFT_NOT_LOADED');
    }
    return this.__nft;
  }
  public set nftId(value: NftAttribs['id'] | undefined) {
    if (value) {
      this.__nft = Nft.build({ id: value, tokenName: '', tokenId: -1 });
    } else {
      this.__nft = null;
      this.nftCachedAt = DateTime.now();
    }
  }
  private nftCachedAt: DateTime | null;

  constructor(options: ExtDataOptions = {}) {
    const { collection, nft } = options;
    this.__collection = collection;
    this.collectionCachedAt = null;
    this.__nft = nft;
    this.nftCachedAt = null;
  }

  @ActionMethod('WIKI/EXT/CHECK_BLOCKS')
  public async updateBlocks(args: { blocks: WikiBlock[] } & ActionArgs) {
    const { blocks, action } = args;

    // Determine what data needs to be loaded
    const expiredExtNames = new Set<string>();
    blocks.forEach((block) => {
      const item = block.getItem();
      if (!item) {
        throw new WikiExtError('WIKI/EXT/ER_BLOCK_NOT_SELECTED');
      }
      if (item.external && item.isLatestCache) {
        forEach(item.external, (ext, name) => {
          if (WikiExt.isExpired(name, ext)) {
            expiredExtNames.add(name);
          }
        });
      }
    });

    // Load data from external sources
    await this.loadData({ expiredExtNames, parentAction: action });

    // Update the block using the fetched data
    blocks.forEach((block) => {
      const item = block.getItem();
      if (!item) {
        throw new WikiExtError('WIKI/EXT/ER_BLOCK_NOT_SELECTED');
      }
      if (item.external && item.isLatestCache) {
        let needsDynamoUpdate = false;

        // Replace the block items that are already loaded
        const newExternal: typeof item.external = {};
        forEach(item.external, (ext, name) => {
          if (WikiExt.isExpired(name, ext)) {
            needsDynamoUpdate = true;
            newExternal[name] = this.getData(name);
          } else {
            newExternal[name] = ext;
          }
        });
        item.external = newExternal;

        // Push updates to DynamoDB
        if (needsDynamoUpdate) {
          // User does not have to wait for cache update, so use callback
          BlockVersion.update(
            {
              WikiPK: WikiKey.getDocumentPK(item.document),
              WikiSK: WikiKey.getBlockSK(item.id, WikiDocument.VERSION_LATEST),
            },
            {
              Ext: this.toRawItem(newExternal),
            },
            (error) => {
              // TODO log update result
              if (error) console.error(error);
            }
          );
        }
      }
    });
    return expiredExtNames;
  }

  @ActionMethod('WIKI/EXT/LOAD_DATA')
  private async loadData(args: { expiredExtNames: Set<string> } & ActionArgs) {
    const { expiredExtNames, transaction } = args;
    const clAttribs: (keyof CollectionAttribs)[] = [
      'id',
      'slug',
      'name',
      'createdAt',
    ];
    const clInclude: Includeable[] = [];
    expiredExtNames.forEach((name) => {
      switch (name) {
        case 'ExtClDiscord':
          clAttribs.push('discordUrl');
          clAttribs.push('discordUpdatedAt');
          break;
        case 'ExtClTwitter':
          clAttribs.push('twitterUrl');
          clAttribs.push('twitterUpdatedAt');
          break;
        case 'ExtClTelegram':
          clAttribs.push('telegramUrl');
          clAttribs.push('telegramUpdatedAt');
          break;
        case 'ExtClWebsite':
          clAttribs.push('websiteUrl');
          clAttribs.push('websiteUpdatedAt');
          break;
        case 'ExtClFloorPrice':
          clAttribs.push('floorPrice');
          clAttribs.push('floorPriceUpdatedAt');
          clInclude.concat(Collection.INCLUDE_OPTS.floorPrice);
          break;
        case 'ExtClMintingPrices':
          clInclude.concat(Collection.INCLUDE_OPTS.mintings);
          break;
        case 'ExtClChains':
          clInclude.concat(Collection.INCLUDE_OPTS.chains);
          break;
        case 'ExtClMarketplaces':
          clInclude.concat(Collection.INCLUDE_OPTS.marketplaces);
          break;
        case 'ExtClCategory':
          clInclude.concat(Collection.INCLUDE_OPTS.category);
          break;
        default:
          throw new WikiExtError({
            code: 'WIKI/EXT/IV_NAME',
            message: `"${name}"`,
          });
      }
    });

    if (this.collection) {
      await this.collection.reload({
        attributes: clAttribs,
        include: clInclude,
        transaction,
      });
      this.collectionCachedAt = DateTime.now();
    } else {
      throw new WikiExtError('WIKI/EXT/ER_COLLECTION_UNSET');
    }

    // TODO reload NFT
  }

  public getData(name: string): BlockExtDTO {
    switch (name) {
      case 'ExtClDiscord':
        return this.getClDiscord();
      case 'ExtClTwitter':
        return this.getClTwitter();
      case 'ExtClTelegram':
        return this.getClTelegram();
      case 'ExtClWebsite':
        return this.getClWebsite();
      case 'ExtClFloorPrice':
        return this.getClFloorPrice();
      case 'ExtClMintingPrices':
        return this.getClMintingPrices();
      case 'ExtClChains':
        return this.getClChains();
      case 'ExtClMarketplaces':
        return this.getClMarketplaces();
      case 'ExtClCategory':
        return this.getClCategory();
      default:
        throw new WikiExtError('WIKI/EXT/IV_NAME');
    }
  }

  private getClDiscord(): BlockExtDTO<string> {
    const cl = this.collection;
    if (cl === null) {
      return {
        cache: null,
        cachedAt: this.collectionCachedAt,
      };
    } else {
      return {
        cache: cl.discordUrl || null,
        cachedAt: this.collectionCachedAt,
        updatedAt: cl.discordUpdatedAt
          ? DateTime.fromJSDate(cl.discordUpdatedAt)
          : undefined,
      };
    }
  }

  private getClTwitter(): BlockExtDTO<string> {
    const cl = this.collection;
    if (cl === null) {
      return {
        cache: null,
        cachedAt: this.collectionCachedAt,
      };
    } else {
      return {
        cache: cl.twitterUrl || null,
        cachedAt: this.collectionCachedAt,
        updatedAt: cl.twitterUpdatedAt
          ? DateTime.fromJSDate(cl.twitterUpdatedAt)
          : undefined,
      };
    }
  }

  private getClTelegram(): BlockExtDTO<string> {
    const cl = this.collection;
    if (cl === null) {
      return {
        cache: null,
        cachedAt: this.collectionCachedAt,
      };
    } else {
      return {
        cache: cl.telegramUrl || null,
        cachedAt: this.collectionCachedAt,
        updatedAt: cl.telegramUpdatedAt
          ? DateTime.fromJSDate(cl.telegramUpdatedAt)
          : undefined,
      };
    }
  }

  private getClWebsite(): BlockExtDTO<string> {
    const cl = this.collection;
    if (cl === null) {
      return {
        cache: null,
        cachedAt: this.collectionCachedAt,
      };
    } else {
      return {
        cache: cl.websiteUrl || null,
        cachedAt: this.collectionCachedAt,
        updatedAt: cl.websiteUpdatedAt
          ? DateTime.fromJSDate(cl.websiteUpdatedAt)
          : undefined,
      };
    }
  }

  private getClFloorPrice(): BlockExtDTO<sigmate.Wiki.ExtFloorPrice> {
    const cl = this.collection;
    if (cl === null) {
      return {
        cache: null,
        cachedAt: this.collectionCachedAt,
      };
    } else if (
      cl.floorPrice !== undefined &&
      cl.floorPriceCurrency &&
      cl.floorPriceUpdatedAt
    ) {
      return {
        cache: {
          floorPrice: cl.floorPrice,
          floorPriceCurrency: {
            symbol: cl.floorPriceCurrency.symbol,
          },
        },
        cachedAt: this.collectionCachedAt,
        updatedAt: DateTime.fromJSDate(cl.floorPriceUpdatedAt),
      };
    } else {
      return {
        cache: null,
        cachedAt: this.collectionCachedAt,
      };
    }
  }

  private getClMintingPrices(): BlockExtDTO<sigmate.Wiki.ExtClMintingPrice[]> {
    const cl = this.collection;
    if (cl === null) {
      return {
        cache: null,
        cachedAt: this.collectionCachedAt,
      };
    } else {
      const prices: sigmate.Wiki.ExtClMintingPrice[] = [];
      cl.mintings?.forEach((minting) => {
        if (minting.price && minting.priceUpdatedAt) {
          prices.push({
            name: minting.name,
            price: minting.price,
            priceUpdatedAt: DateTime.fromJSDate(minting.priceUpdatedAt),
          });
        }
      });
      return {
        cache: prices,
        cachedAt: this.collectionCachedAt,
      };
    }
  }

  private getClChains(): BlockExtDTO<sigmate.Wiki.ExtChain[]> {
    const cl = this.collection;
    if (cl === null) {
      return {
        cache: null,
        cachedAt: this.collectionCachedAt,
      };
    } else {
      const chains: sigmate.Wiki.ExtChain[] = [];
      cl.chains?.forEach((chain) => {
        chains.push({ symbol: chain.symbol });
      });
      return {
        cache: chains,
        cachedAt: this.collectionCachedAt,
      };
    }
  }

  private getClMarketplaces(): BlockExtDTO<sigmate.Wiki.ExtMarketplace[]> {
    const cl = this.collection;
    if (cl === null) {
      return {
        cache: null,
        cachedAt: this.collectionCachedAt,
      };
    } else {
      const marketplaces: sigmate.Wiki.ExtMarketplace[] = [];
      cl.marketplaces?.forEach((marketplace) => {
        marketplaces.push({
          name: marketplace.name,
          url: marketplace.url,
          collectionUrl: marketplace.CollectionMarketplace?.collectionUrl,
          logoImage: marketplace.logoImage?.url,
        });
      });
      return {
        cache: marketplaces,
        cachedAt: this.collectionCachedAt,
      };
    }
  }

  private getClCategory(): BlockExtDTO<sigmate.Wiki.ExtCategory> {
    const cl = this.collection;
    if (cl === null) {
      return {
        cache: null,
        cachedAt: this.collectionCachedAt,
      };
    } else if (cl.category) {
      return {
        cache: {
          id: cl.category.id,
          name: cl.category.name,
        },
        cachedAt: this.collectionCachedAt,
      };
    } else {
      return {
        cache: null,
        cachedAt: this.collectionCachedAt,
      };
    }
  }

  public static toItem(
    rawItem: sigmate.Wiki.BlockRawItemAttribs['Ext']
  ): sigmate.Wiki.BlockItemAttribs['external'] {
    if (!rawItem) return undefined;
    return mapValues(rawItem, (ext) => ({
      cache: ext.cache,
      cachedAt: ext.cachedAt ? DateTime.fromISO(ext.cachedAt) : null,
      updatedAt: ext.updatedAt ? DateTime.fromISO(ext.updatedAt) : undefined,
    }));
  }

  private toItem(
    rawItem: sigmate.Wiki.BlockRawItemAttribs['Ext']
  ): sigmate.Wiki.BlockItemAttribs['external'] {
    return WikiExt.toItem(rawItem);
  }

  public static toRawItem(
    item: sigmate.Wiki.BlockItemAttribs['external']
  ): sigmate.Wiki.BlockRawItemAttribs['Ext'] {
    if (!item) return undefined;
    return mapValues(item, (ext) => ({
      cache: ext.cache,
      cachedAt: ext.cachedAt?.toISO() || null,
      updatedAt: ext.updatedAt?.toISO(),
    }));
  }

  private toRawItem(
    item: sigmate.Wiki.BlockItemAttribs['external']
  ): sigmate.Wiki.BlockRawItemAttribs['Ext'] {
    return WikiExt.toRawItem(item);
  }
}
