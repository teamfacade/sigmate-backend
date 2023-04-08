import { forEach } from 'lodash';
import { DateTime, DurationLike } from 'luxon';
import {
  Collection,
  CollectionAttribs,
} from '../../models/chain/Collection.model';
import WikiExtError from '../../errors/wiki/ext';
import { Includeable } from 'sequelize/types';

type Ext<CT extends sigmate.Wiki.ExtCache = sigmate.Wiki.ExtCache> =
  sigmate.Wiki.Ext<CT> | null;

/** WikiXD: Wiki eXternal Data Service */
export default class WikiEDS {
  /** External data needed for Key info */
  private static KI_EXTS = new Map<string, sigmate.Wiki.ExtDataName[]>(
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
  private static MAX_AGE = new Map<string, DurationLike>(
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

  public static isExpired(name: string, data: Ext) {
    if (!data) return true;
    const maxAge = this.MAX_AGE.get(name);
    if (!maxAge) return false;
    const expiresAt = data.cachedAt.plus(maxAge);
    return DateTime.now() >= expiresAt;
  }

  public static getKIExt(name: sigmate.Wiki.BlockKI['name']) {
    const exts = this.KI_EXTS.get(name);
    if (!exts) {
      throw new WikiExtError('WIKI/EXT/IV_KI_NAME');
    }
    return exts;
  }

  public static getExpired(
    document: sigmate.Wiki.DocumentAttribs
  ): Set<sigmate.Wiki.ExtDataName> {
    const expired = new Set<sigmate.Wiki.ExtDataName>();
    if (document.external) {
      const external = document.external;
      forEach(external, (data, name) => {
        if (data && this.isExpired(name, data)) {
          expired.add(name as sigmate.Wiki.ExtDataName);
        }
      });
    }
    return expired;
  }

  public static fromDynamo<CT extends sigmate.Wiki.ExtCache>(
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

  public static toDynamo<CT extends sigmate.Wiki.ExtCache>(
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

  public static mintingPricesToDynamo(
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

  public static mintingPricesFromDynamo(
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

  private __collection?: Collection | null;
  private expired?: Set<sigmate.Wiki.ExtDataName>;
  public collectionCachedAt: DateTime | null;
  public get collection() {
    if (this.__collection === undefined) {
      throw new Error('Collection not found');
    }
    return this.__collection;
  }
  public set collection(cl) {
    this.__collection = cl;
    this.collectionCachedAt = cl === undefined ? null : DateTime.now();
  }

  public get getKIExt() {
    return WikiEDS.getKIExt;
  }

  constructor() {
    this.collectionCachedAt = null;
  }

  public getExpired(document: sigmate.Wiki.DocumentAttribs) {
    const expired = WikiEDS.getExpired(document);
    this.expired = expired;

    // What to load in collection load?
    let clLoad = false;
    const clAttribs: (keyof CollectionAttribs)[] = ['id', 'slug'];
    const clInclude: Includeable[] = [];
    expired.forEach((name) => {
      switch (name) {
        case 'ExtClName':
          clLoad = true;
          clAttribs.push('name');
          break;
        case 'ExtClDiscord':
          clLoad = true;
          clAttribs.push('discordUrl');
          clAttribs.push('discordUpdatedAt');
          break;
        case 'ExtClTwitter':
          clLoad = true;
          clAttribs.push('twitterUrl');
          clAttribs.push('twitterUpdatedAt');
          break;
        case 'ExtClTelegram':
          clLoad = true;
          clAttribs.push('telegramUrl');
          clAttribs.push('telegramUpdatedAt');
          break;
        case 'ExtClWebsite':
          clLoad = true;
          clAttribs.push('websiteUrl');
          clAttribs.push('websiteUpdatedAt');
          break;
        case 'ExtClFloorPrice':
          clLoad = true;
          clAttribs.push('floorPrice');
          clAttribs.push('floorPriceUpdatedAt');
          clInclude.concat(Collection.INCLUDE_OPTS.floorPrice);
          break;
        case 'ExtClMintingPrices':
          clLoad = true;
          clInclude.concat(Collection.INCLUDE_OPTS.mintings);
          break;
        case 'ExtClChains':
          clLoad = true;
          clInclude.concat(Collection.INCLUDE_OPTS.chains);
          break;
        case 'ExtClMarketplaces':
          clLoad = true;
          clInclude.concat(Collection.INCLUDE_OPTS.marketplaces);
          break;
        case 'ExtClCategory':
          clLoad = true;
          clInclude.concat(Collection.INCLUDE_OPTS.category);
          break;
      }
    });

    // const docInclude: Includeable[] = [];
    // if (clLoad) {
    //   docInclude.push({
    //     model: Collection,
    //     include: clInclude,
    //     attributes: clAttribs,
    //   });
    // }

    return {
      expired,
      collection: clLoad
        ? { attributes: clAttribs, include: clInclude }
        : undefined,
    };
  }

  public updateExpired(
    document: sigmate.Wiki.DocumentAttribs
  ): sigmate.Wiki.DocumentAttribs['external'] {
    if (!document.external) return document.external;
    const expired = this.expired || this.getExpired(document).expired;
    const ext = document.external;
    const {
      ExtClName,
      ExtClCategory,
      ExtClChains,
      ExtClDiscord,
      ExtClFloorPrice,
      ExtClMarketplaces,
      ExtClMintingPrices,
      ExtClTelegram,
      ExtClTwitter,
      ExtClWebsite,
    } = ext;

    ext.ExtClName =
      ExtClName && expired.has('ExtClName') ? this.getClName() : ExtClName;
    ext.ExtClDiscord =
      ExtClDiscord && expired.has('ExtClDiscord')
        ? this.getClDiscord()
        : ExtClDiscord;
    ext.ExtClTwitter =
      ExtClTwitter && expired.has('ExtClTwitter')
        ? this.getClTwitter()
        : ExtClTwitter;
    ext.ExtClTelegram =
      ExtClTelegram && expired.has('ExtClTelegram')
        ? this.getClTelegram()
        : ExtClTelegram;
    ext.ExtClWebsite =
      ExtClWebsite && expired.has('ExtClWebsite')
        ? this.getClWebsite()
        : ExtClWebsite;
    ext.ExtClCategory =
      ExtClCategory && expired.has('ExtClCategory')
        ? this.getClCategory()
        : ExtClCategory;
    ext.ExtClChains =
      ExtClChains && expired.has('ExtClChains')
        ? this.getClChains()
        : ExtClChains;
    ext.ExtClFloorPrice =
      ExtClFloorPrice && expired.has('ExtClFloorPrice')
        ? this.getClFloorPrice()
        : ExtClFloorPrice;
    ext.ExtClMarketplaces =
      ExtClMarketplaces && expired.has('ExtClMarketplaces')
        ? this.getClMarketplaces()
        : ExtClMarketplaces;
    ext.ExtClMintingPrices =
      ExtClMintingPrices && expired.has('ExtClMintingPrices')
        ? this.getClMintingPrices()
        : ExtClMintingPrices;

    return ext;
  }

  // public getData(name: string): Ext {
  //   let data: Ext;
  //   switch (name) {
  //     case 'ExtClName':
  //       data = this.getClName();
  //       break;
  //     case 'ExtClDiscord':
  //       data = this.getClDiscord();
  //       break;
  //     case 'ExtClTwitter':
  //       data = this.getClTwitter();
  //       break;
  //     case 'ExtClTelegram':
  //       data = this.getClTelegram();
  //       break;
  //     case 'ExtClWebsite':
  //       data = this.getClWebsite();
  //       break;
  //     case 'ExtClFloorPrice':
  //       data = this.getClFloorPrice();
  //       break;
  //     case 'ExtClMintingPrices':
  //       data = this.getClMintingPrices();
  //       break;
  //     case 'ExtClChains':
  //       data = this.getClChains();
  //       break;
  //     case 'ExtClMarketplaces':
  //       data = this.getClMarketplaces();
  //       break;
  //     case 'ExtClCategory':
  //       data = this.getClCategory();
  //       break;
  //     default:
  //       throw new WikiExtError('WIKI/EXT/IV_NAME');
  //   }
  //   return data;
  // }

  public getClName(): Ext<string> {
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

  public getClDiscord(): Ext<string> {
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

  public getClTwitter(): Ext<string> {
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

  public getClTelegram(): Ext<string> {
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

  public getClWebsite(): Ext<string> {
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

  public getClFloorPrice(): Ext<sigmate.Wiki.ExtFloorPrice> {
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

  public getClMintingPrices(): Ext<sigmate.Wiki.ExtClMintingPrice[]> {
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

  public getClChains(): Ext<sigmate.Wiki.ExtChain[]> {
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

  public getClMarketplaces(): Ext<sigmate.Wiki.ExtMarketplace[]> {
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

  public getClCategory(): Ext<sigmate.Wiki.ExtCategory> {
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
}
