import { forEach } from 'lodash';
import { DateTime, DurationLike } from 'luxon';
import { Includeable } from 'sequelize/types';
import WikiExtError from '../../errors/wiki/ext';
import {
  Collection,
  CollectionAttribs,
} from '../../models/chain/Collection.model';
import { Nft, NftAttribs } from '../../models/chain/Nft.model';
import { ActionArgs, ActionMethod } from '../../utils/action';

type ExtDataOptions = {
  collection?: Collection | null;
  collectionId?: CollectionAttribs['id'];
  nft?: Nft | null;
  nftId?: NftAttribs['id'];
};

type Ext<CT extends sigmate.Wiki.ExtCache = sigmate.Wiki.ExtCache> =
  sigmate.Wiki.Ext<CT> | null;

/**
 * Fetching/Caching Wiki document content that is stored externally in SQL database, or 3rd party APIs
 */
export default class WikiExt {
  static KI_EXTS = new Map<string, sigmate.Wiki.ExtDataName[]>(
    Object.entries({
      KIClCategory: ['ExtClCategory'],
      KIClDiscord: ['ExtClDiscord'],
      KIClFloorprice: ['ExtClFloorPrice'],
      KIClHistory: [],
      KIClMarketplaces: ['ExtClMarketplaces'],
      KIClMintingPrices: ['ExtClMintingPrices'],
      KIClTeam: [],
      KIClTwitter: ['ExtClTwitter'],
    })
  );

  /** Expire the cached data in DynamoDB after this time has elapsed */
  static MAX_AGE = new Map<string, DurationLike>(
    Object.entries({
      ExtClName: { day: 1 },
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

  static ExtRE: Readonly<Record<sigmate.Wiki.ExtDataName, RegExp>> =
    Object.freeze({
      ExtClId: /:__ExtClId__:/g,
      ExtNftId: /:__ExtNftId__:/g,
      ExtClName: /:__ExtClName__:/g,
      ExtClDiscord: /:__ExtClDiscord__:/g,
      ExtClTwitter: /:__ExtClTwitter__:/g,
      ExtClTelegram: /:__ExtClTelegram__:/g,
      ExtClWebsite: /:__ExtClWebsite__:/g,
      ExtClChains: /:__ExtClChains__:/g,
      ExtClMarketplaces: /:__ExtClMarketplaces__:/g,
      ExtClCategory: /:__ExtClCategory__:/g,
      ExtClFloorPrice: /:__ExtClFloorPrice__:/g,
      ExtClMintingPrices: /:__ExtClMintingPrices__:/g,
    });

  static BUILDABLE = new Set<string>([
    'ExtClName',
    'ExtClDiscord',
    'ExtClTwitter',
    'ExtClTelegram',
    'ExtClWebsite',
  ]);

  static isBuildable(name: string) {
    return this.BUILDABLE.has(name);
  }

  static isExpired(name: string, data: Ext) {
    if (!data) return true;
    const maxAge = this.MAX_AGE.get(name);
    if (!maxAge) return false;
    const expiresAt = data.cachedAt.plus(maxAge);
    return DateTime.now() >= expiresAt;
  }

  static getKIExt(name: sigmate.Wiki.BlockKI['name']) {
    const exts = this.KI_EXTS.get(name);
    if (!exts) {
      throw new WikiExtError('WIKI/EXT/IV_KI_NAME');
    }
    return exts;
  }

  private __collection?: Collection | null;
  private collectionCachedAt: DateTime | null;
  public set collectionId(value: CollectionAttribs['id'] | null | undefined) {
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
  public set nftId(value: NftAttribs['id'] | null | undefined) {
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

  public get isExpired() {
    return WikiExt.isExpired;
  }

  @ActionMethod('WIKI/EXT/LOAD_EXPIRED')
  public async loadExpired(
    args: { document: sigmate.Wiki.DocumentAttribs } & ActionArgs
  ) {
    const { document, transaction } = args;

    const expiredNames = new Set<string>();
    if (!document.external) return expiredNames;
    const external = document.external;
    forEach(external, (ext, name) => {
      if (ext && this.isExpired(name, ext)) {
        expiredNames.add(name);
      }
    });

    const clAttribs: (keyof CollectionAttribs)[] = ['id', 'slug'];
    const clInclude: Includeable[] = [];
    expiredNames.forEach((name) => {
      switch (name) {
        case 'ExtClName':
          clAttribs.push('name');
          break;
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
      }
    });

    if (this.collection) {
      await this.collection?.reload({
        attributes: clAttribs,
        include: clInclude,
        transaction,
      });
      this.collectionCachedAt = DateTime.now();
    }
    // TODO reload NFT

    document.external = {
      ExtClId: external.ExtClId,
      ExtNftId: external.ExtNftId,
      ExtClName: expiredNames.has('ExtClName')
        ? this.getClName()
        : external.ExtClName,
      ExtClDiscord: expiredNames.has('ExtClDiscord')
        ? this.getClDiscord()
        : external.ExtClDiscord,
      ExtClTwitter: expiredNames.has('ExtClTwitter')
        ? this.getClTwitter()
        : external.ExtClTwitter,
      ExtClTelegram: expiredNames.has('ExtClTelegram')
        ? this.getClTelegram()
        : external.ExtClTelegram,
      ExtClWebsite: expiredNames.has('ExtClWebsite')
        ? this.getClWebsite()
        : external.ExtClWebsite,
      ExtClChains: expiredNames.has('ExtClChains')
        ? this.getClChains()
        : external.ExtClChains,
      ExtClMarketplaces: expiredNames.has('ExtClMarketplaces')
        ? this.getClMarketplaces()
        : external.ExtClMarketplaces,
      ExtClCategory: expiredNames.has('ExtClCategory')
        ? this.getClCategory()
        : external.ExtClCategory,
      ExtClFloorPrice: expiredNames.has('ExtClFloorPrice')
        ? this.getClFloorPrice()
        : external.ExtClFloorPrice,
      ExtClMintingPrices: expiredNames.has('ExtClMintingPrices')
        ? this.getClMintingPrices()
        : external.ExtClMintingPrices,
    };

    return expiredNames;
  }

  public getData(name: string): Ext {
    let data: Ext;
    switch (name) {
      case 'ExtClName':
        data = this.getClName();
        break;
      case 'ExtClDiscord':
        data = this.getClDiscord();
        break;
      case 'ExtClTwitter':
        data = this.getClTwitter();
        break;
      case 'ExtClTelegram':
        data = this.getClTelegram();
        break;
      case 'ExtClWebsite':
        data = this.getClWebsite();
        break;
      case 'ExtClFloorPrice':
        data = this.getClFloorPrice();
        break;
      case 'ExtClMintingPrices':
        data = this.getClMintingPrices();
        break;
      case 'ExtClChains':
        data = this.getClChains();
        break;
      case 'ExtClMarketplaces':
        data = this.getClMarketplaces();
        break;
      case 'ExtClCategory':
        data = this.getClCategory();
        break;
      default:
        throw new WikiExtError('WIKI/EXT/IV_NAME');
    }
    return data;
  }

  private getClName(): Ext<string> {
    const cl = this.collection;
    if (this.collectionCachedAt) {
      if (cl === null) {
        return { cache: null, cachedAt: this.collectionCachedAt };
      } else {
        return {
          cache: cl.name || null,
          cachedAt: this.collectionCachedAt,
        };
      }
    } else {
      return null;
    }
  }

  private getClDiscord(): Ext<string> {
    const cl = this.collection;
    if (this.collectionCachedAt) {
      if (cl === null) {
        return { cache: null, cachedAt: this.collectionCachedAt };
      } else {
        return {
          cache: cl.discordUrl || null,
          cachedAt: this.collectionCachedAt,
          updatedAt: cl.discordUpdatedAt
            ? DateTime.fromJSDate(cl.discordUpdatedAt)
            : undefined,
        };
      }
    } else {
      return null;
    }
  }

  private getClTwitter(): Ext<string> {
    const cl = this.collection;
    if (this.collectionCachedAt) {
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
    } else {
      return null;
    }
  }

  private getClTelegram(): Ext<string> {
    const cl = this.collection;
    if (this.collectionCachedAt) {
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
    } else {
      return null;
    }
  }

  private getClWebsite(): Ext<string> {
    const cl = this.collection;
    if (this.collectionCachedAt) {
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
    } else {
      return null;
    }
  }

  private getClFloorPrice(): Ext<sigmate.Wiki.ExtFloorPrice> {
    const cl = this.collection;
    if (this.collectionCachedAt) {
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
    } else {
      return null;
    }
  }

  private getClMintingPrices(): Ext<sigmate.Wiki.ExtClMintingPrice[]> {
    const cl = this.collection;
    if (this.collectionCachedAt) {
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
              id: minting.id,
              name: minting.name,
              price: minting.price,
              priceUpdatedAt: DateTime.fromJSDate(minting.priceUpdatedAt),
              startsAt: DateTime.fromJSDate(minting.startsAt),
              startsAtPrecision: minting.startsAtPrecision,
            });
          }
        });
        return {
          cache: prices,
          cachedAt: this.collectionCachedAt,
        };
      }
    } else {
      return null;
    }
  }

  private getClChains(): Ext<sigmate.Wiki.ExtChain[]> {
    const cl = this.collection;
    if (this.collectionCachedAt) {
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
    } else {
      return null;
    }
  }

  private getClMarketplaces(): Ext<sigmate.Wiki.ExtMarketplace[]> {
    const cl = this.collection;
    if (this.collectionCachedAt) {
      if (cl === null) {
        return {
          cache: null,
          cachedAt: this.collectionCachedAt,
        };
      } else {
        const marketplaces: sigmate.Wiki.ExtMarketplace[] = [];
        cl.marketplaces?.forEach((marketplace) => {
          marketplaces.push({
            id: marketplace.id,
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
    } else {
      return null;
    }
  }

  private getClCategory(): Ext<sigmate.Wiki.ExtCategory> {
    const cl = this.collection;
    if (this.collectionCachedAt) {
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
    } else {
      return null;
    }
  }

  public static toItem<CT extends sigmate.Wiki.ExtCache>(
    raw: sigmate.Wiki.ExtRaw<CT> | null | undefined
  ): sigmate.Wiki.Ext<CT> | null | undefined {
    return raw
      ? {
          cache: raw.cache,
          cachedAt: DateTime.fromISO(raw.cachedAt),
          updatedAt: raw.updatedAt
            ? DateTime.fromISO(raw.updatedAt)
            : undefined,
        }
      : raw;
  }

  public static toRaw<CT extends sigmate.Wiki.ExtCache>(
    item: sigmate.Wiki.Ext<CT> | null | undefined
  ): sigmate.Wiki.ExtRaw<CT> | null | undefined {
    return item
      ? {
          cache: item.cache,
          cachedAt: item.cachedAt.toISO(),
          updatedAt: item.updatedAt?.toISO(),
        }
      : item;
  }

  public static mintingPricesToRaw(
    item: NonNullable<
      sigmate.Wiki.DocumentAttribs['external']
    >['ExtClMintingPrices']
  ): sigmate.Wiki.DocumentRawAttribs['ExtClMintingPrices'] {
    if (!item) return item;
    return {
      cache:
        item.cache?.map((c) => ({
          ...c,
          priceUpdatedAt: c.priceUpdatedAt.toISO(),
          startsAt: c.startsAt.toISO(),
        })) || null,
      cachedAt: item.cachedAt.toISO(),
      updatedAt: item.updatedAt?.toISO(),
    };
  }

  public static mintingPricesToItem(
    raw: sigmate.Wiki.DocumentRawAttribs['ExtClMintingPrices']
  ): NonNullable<
    sigmate.Wiki.DocumentAttribs['external']
  >['ExtClMintingPrices'] {
    if (!raw) return raw;
    return {
      cache:
        raw.cache?.map((c) => ({
          ...c,
          priceUpdatedAt: DateTime.fromISO(c.priceUpdatedAt),
          startsAt: DateTime.fromISO(c.startsAt),
        })) || null,
      cachedAt: DateTime.fromISO(raw.cachedAt),
      updatedAt: raw.updatedAt ? DateTime.fromISO(raw.updatedAt) : undefined,
    };
  }
}
