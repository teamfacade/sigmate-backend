import _ from 'lodash';
import {
  AllowNull,
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  Default,
  HasMany,
  HasOne,
  IsIn,
  Length,
  Model,
  Table,
  Unique,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import BcToken, { BcTokenCreationAttributes, BcTokenResponse } from './BcToken';
import Block, { BlockResponse } from './Block';
import CollectionDeployer, {
  CollectionDeployerAttributes,
} from './CollectionDeployer';
import CollectionPaymentToken from './CollectionPaymentToken';
import CollectionCategory, {
  CollectionCategoryAttributes,
} from './CollectionCategory';
import CollectionUtility, {
  CollectionUtilityAttributes,
} from './CollectionUtility';
import Document, { DocumentAttributes } from './Document';
import MintingSchedule from './MintingSchedule';
import Nft from './Nft';
import User, { UserAttributes } from './User';
import UserDevice, { UserDeviceAttributes } from './UserDevice';
import Channel from './Channel';
import DiscordAnnouncement from './DiscordAnnouncement';
import TwitterAnnouncement from './TwitterAnnouncement';
import axios from 'axios';
import { DateTime } from 'luxon';

export interface CollectionAttributes {
  id: number;
  contractAddress?: string;
  collectionDeployers?: CollectionDeployer[];
  slug: string;
  name: string; // display name
  description?: string;
  paymentTokens?: BcToken[];
  contractSchema: string; // ERC721
  email?: string;
  blogUrl?: string;
  redditUrl?: string;
  facebookUrl?: string;
  twitterHandle?: string;
  discordUrl?: string;
  websiteUrl?: string;
  telegramUrl?: string;
  bitcointalkUrl?: string;
  githubUrl?: string;
  wechatUrl?: string;
  linkedInUrl?: string;
  whitepaperUrl?: string;
  imageUrl?: string;
  bannerImageUrl?: string;
  mintingPriceWl?: string;
  mintingPricePublic?: string;
  floorPrice?: string;
  floorPriceUnit?: string;
  floorPriceExchangeNeeded: boolean;
  floorPriceExchangeRate?: number;
  floorPriceExchangeRateFetchedAt?: Date;
  documentId?: DocumentAttributes['id'];
  document?: Document;
  discordAnnouncement?: DiscordAnnouncement[];
  twitterAnnouncement?: TwitterAnnouncement[];
  createdById?: UserAttributes['id'];
  createdBy?: User;
  createdByDeviceId?: UserDeviceAttributes['id'];
  createdByDevice?: UserDevice;
  createdAt?: Date;
  updatedBy?: User;
  updatedByDevice?: UserDevice;
  updatedAt?: Date;
  deletedBy?: User;
  deletedByDevice?: UserDevice;
  mintingSchedules?: MintingSchedule[];
  category?: CollectionCategory;
  utility?: CollectionUtility;
  marketplace: string;
  nfts?: Nft[];
  openseaMetadataUpdatedAt?: Date;
  openseaPriceUpdatedAt?: Date;

  // Blocks
  // For verifying collection data
  blocks?: Block[];
  channel?: Channel;
  discordAnnouncements?: DiscordAnnouncement[];
  twitterAnnouncements?: TwitterAnnouncement[];

  // for confirm
  adminConfirmed?: boolean;
  adminConfirmedBy?: User;
  adminConfirmedById?: UserAttributes['id'];
  infoSource: string; // 'opensea' 'admin' 'user'\
  infoConfirmedBy?: User;
  infoConfirmedById?: UserAttributes['id'];
}

export type CollectionCreationAttributes = Optional<
  CollectionAttributes,
  'id' | 'floorPriceExchangeNeeded'
>;

export type BlockCollectionAttrib =
  | 'team'
  | 'history'
  | 'category'
  | 'utility'
  | 'mintingPriceWl'
  | 'mintingPricePublic'
  | 'floorPrice'
  | 'discordUrl'
  | 'twitterHandle'
  | 'websiteUrl'
  | 'paymentTokens'
  | 'marketplace'
  | '';

export type CollectionResponseConcise = Pick<
  CollectionAttributes,
  'id' | 'slug' | 'name' | 'imageUrl' | 'bannerImageUrl'
>;

export interface CollectionResponse
  extends Pick<
    CollectionAttributes,
    | 'id'
    | 'contractAddress'
    | 'slug'
    | 'name'
    | 'description'
    | 'contractSchema'
    | 'email'
    | 'blogUrl'
    | 'redditUrl'
    | 'facebookUrl'
    | 'twitterHandle'
    | 'discordUrl'
    | 'websiteUrl'
    | 'telegramUrl'
    | 'bitcointalkUrl'
    | 'githubUrl'
    | 'wechatUrl'
    | 'linkedInUrl'
    | 'whitepaperUrl'
    | 'imageUrl'
    | 'bannerImageUrl'
    | 'floorPrice'
    | 'mintingPriceWl'
    | 'mintingPricePublic'
    | 'marketplace'
    | 'openseaMetadataUpdatedAt'
    | 'openseaPriceUpdatedAt'
    | 'infoSource'
    | 'infoConfirmedBy'
    | 'infoConfirmedById'
  > {
  collectionDeployers: (CollectionDeployerAttributes['address'] | null)[];
  paymentTokens?: (BcTokenResponse | null)[];
  document: Pick<DocumentAttributes, 'id' | 'title'>;
  category: Pick<CollectionCategoryAttributes, 'id' | 'name'>;
  utility: Pick<CollectionUtilityAttributes, 'id' | 'name'>;
  blocks?: Record<BlockCollectionAttrib, BlockResponse>;
}

export interface CollectionCreationDTO
  extends Pick<
    CollectionAttributes,
    | 'contractAddress'
    | 'slug'
    | 'name'
    | 'description'
    | 'contractSchema'
    | 'email'
    | 'blogUrl'
    | 'redditUrl'
    | 'facebookUrl'
    | 'twitterHandle'
    | 'discordUrl'
    | 'websiteUrl'
    | 'telegramUrl'
    | 'bitcointalkUrl'
    | 'githubUrl'
    | 'wechatUrl'
    | 'linkedInUrl'
    | 'whitepaperUrl'
    | 'imageUrl'
    | 'bannerImageUrl'
    | 'mintingPriceWl'
    | 'mintingPricePublic'
    | 'floorPrice'
    | 'document'
    | 'marketplace'
    | 'openseaMetadataUpdatedAt'
    | 'openseaPriceUpdatedAt'
    | 'infoSource'
    | 'infoConfirmedBy'
    | 'infoConfirmedById'
    | 'adminConfirmed'
    | 'adminConfirmedBy'
    | 'adminConfirmedById'
  > {
  collectionDeployers: CollectionDeployerAttributes['address'][];
  paymentTokens: BcTokenCreationAttributes[];
  category?: CollectionCategoryAttributes['name'];
  utility?: CollectionUtilityAttributes['name'];
  createdBy: User;
  createdByDevice?: UserDevice;
  team?: string;
  history?: string;
  // for confirm
  confirmed?: boolean;
  confirmedBy?: User;
}

export interface CollectionUpdateDTO
  extends Omit<
    Partial<CollectionCreationDTO>,
    'createdBy' | 'createdByDevice'
  > {
  updatedBy?: User;
  updatedByDevice?: UserDevice;
}

export interface CollectionDeletionDTO
  extends Pick<CollectionAttributes, 'slug'> {
  deletedBy?: User;
  deletedByDevice?: UserDevice;
}

export const OPENSEA_METADATA_UPDATE_PERIOD = 24 * 60 * 60 * 1000;
export const OPENSEA_PRICE_UPDATE_PERIOD = 60 * 60 * 1000;

@Table({
  modelName: 'Collection',
  tableName: 'collections',
  timestamps: true,
  underscored: true,
  paranoid: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class Collection extends Model<
  CollectionAttributes,
  CollectionCreationAttributes
> {
  @Column(DataType.STRING(50))
  contractAddress: CollectionAttributes['contractAddress'];

  @HasMany(() => CollectionDeployer, 'collectionId')
  collectionDeployers: CollectionAttributes['collectionDeployers'];

  @Unique('slug')
  @AllowNull(false)
  @Column(DataType.STRING(191))
  slug!: CollectionAttributes['slug'];

  @AllowNull(false)
  @Column(DataType.STRING(191))
  name!: CollectionAttributes['name'];

  @Column(DataType.TEXT)
  description: CollectionAttributes['description'];

  @BelongsToMany(() => BcToken, () => CollectionPaymentToken)
  paymentTokens: CollectionAttributes['paymentTokens'];

  @Default('ERC721')
  @AllowNull(false)
  @Column(DataType.STRING(16))
  contractSchema!: CollectionAttributes['contractSchema'];

  @Column(DataType.STRING(191))
  email: CollectionAttributes['email'];

  @Column(DataType.STRING(1024))
  blogUrl: CollectionAttributes['blogUrl'];

  @Column(DataType.STRING(1024))
  redditUrl: CollectionAttributes['redditUrl'];

  @Column(DataType.STRING(1024))
  facebookUrl: CollectionAttributes['facebookUrl'];

  @Column(DataType.STRING(25))
  twitterHandle: CollectionAttributes['twitterHandle'];

  @Column(DataType.STRING(1024))
  discordUrl: CollectionAttributes['discordUrl'];

  @Column(DataType.STRING(1024))
  websiteUrl: CollectionAttributes['websiteUrl'];

  @Column(DataType.STRING(1024))
  telegramUrl: CollectionAttributes['telegramUrl'];

  @Column(DataType.STRING(1024))
  bitcointalkUrl: CollectionAttributes['bitcointalkUrl'];

  @Column(DataType.STRING(1024))
  githubUrl: CollectionAttributes['githubUrl'];

  @Column(DataType.STRING(1024))
  wechatUrl: CollectionAttributes['wechatUrl'];

  @Column(DataType.STRING(1024))
  linkedInUrl: CollectionAttributes['linkedInUrl'];

  @Column(DataType.STRING(1024))
  whitepaperUrl: CollectionAttributes['whitepaperUrl'];

  @Column(DataType.STRING(1024))
  imageUrl: CollectionAttributes['imageUrl'];

  @Column(DataType.STRING(1024))
  bannerImageUrl: CollectionAttributes['bannerImageUrl'];

  @Column(DataType.STRING)
  mintingPriceWl?: CollectionAttributes['mintingPriceWl'];

  @Column(DataType.STRING)
  mintingPricePublic?: CollectionAttributes['mintingPricePublic'];

  @Default('0')
  @Column(DataType.STRING)
  floorPrice: CollectionAttributes['floorPrice'];

  @Length({ max: 16 })
  @Column(DataType.STRING(16))
  floorPriceUnit: CollectionAttributes['floorPriceUnit'];

  @Default(false)
  @Column(DataType.BOOLEAN)
  floorPriceExchangeNeeded!: CollectionAttributes['floorPriceExchangeNeeded'];

  @Column(DataType.DOUBLE)
  floorPriceExchangeRate: CollectionAttributes['floorPriceExchangeRate'];

  @Column(DataType.DATE)
  floorPriceExchangeRateFetchedAt: CollectionAttributes['floorPriceExchangeRateFetchedAt'];

  @HasOne(() => Document, 'collectionId')
  document: CollectionAttributes['document'];

  @BelongsTo(() => User, 'createdById')
  createdBy: CollectionAttributes['createdBy'];

  @BelongsTo(() => UserDevice, 'createdByDeviceId')
  createdByDevice: CollectionAttributes['createdByDevice'];

  @BelongsTo(() => User, 'updatedById')
  updatedBy: CollectionAttributes['updatedBy'];

  @BelongsTo(() => UserDevice, 'updatedByDeviceId')
  updatedByDevice: CollectionAttributes['updatedByDevice'];

  @BelongsTo(() => User, 'deletedById')
  deletedBy: CollectionAttributes['deletedBy'];

  @BelongsTo(() => UserDevice, 'deletedByDeviceId')
  deletedByDevice: CollectionAttributes['deletedByDevice'];

  @HasMany(() => MintingSchedule, 'collectionId')
  mintingSchedules: CollectionAttributes['mintingSchedules'];

  @BelongsTo(() => CollectionCategory, 'collectionCategoryId')
  category: CollectionAttributes['category'];

  @BelongsTo(() => CollectionUtility, 'collectionUtilityId')
  utility: CollectionAttributes['utility'];

  @AllowNull(false)
  @Column(DataType.STRING(191))
  marketplace!: CollectionAttributes['marketplace'];

  @HasMany(() => Nft, 'collectionId')
  nfts: CollectionAttributes['nfts'];

  @Column(DataType.DATE)
  openseaMetadataUpdatedAt: CollectionAttributes['openseaMetadataUpdatedAt'];

  @HasMany(() => DiscordAnnouncement, 'collectionId')
  discordAnnouncement: CollectionAttributes['discordAnnouncement'];

  @HasMany(() => TwitterAnnouncement, 'collectionId')
  twitterAnnouncement: CollectionAttributes['twitterAnnouncement'];

  @Column(DataType.DATE)
  openseaPriceUpdatedAt: CollectionAttributes['openseaPriceUpdatedAt'];

  @HasMany(() => Block, 'collectionId')
  blocks: CollectionAttributes['blocks'];

  // for admin page
  @Default(false)
  @Column(DataType.BOOLEAN)
  adminConfirmed: CollectionAttributes['adminConfirmed'];

  @BelongsTo(() => User, 'adminConfirmedById')
  adminConfirmedBy: CollectionAttributes['adminConfirmedBy'];

  @IsIn([['opensea', 'admin', 'user']])
  @Column(DataType.STRING(16))
  infoSource?: CollectionAttributes['infoSource'];

  // for admin page
  @BelongsTo(() => User, 'infoConfirmedById')
  infoConfirmedBy: CollectionAttributes['infoConfirmedBy'];

  /**
   * Fetch floor price with appropriate unit exchange.
   * Uses the Binance ticker API
   * Exchange rate is refreshed every 10 minutes.
   */
  async getFloorPrice() {
    if (!this.floorPrice || !this.floorPriceExchangeNeeded)
      return this.floorPrice;

    let shouldFetch = false;
    if (!this.floorPriceExchangeRateFetchedAt) {
      shouldFetch = true;
    } else {
      const now = DateTime.now().setZone('utc');
      const lastFetched = DateTime.fromJSDate(
        this.floorPriceExchangeRateFetchedAt
      );
      if (now > lastFetched.plus({ minutes: 10 })) {
        // More than 10 minutes since last update. Need to fetch again
        shouldFetch = true;
      }
    }

    let exchangeRate = 1;
    if (shouldFetch) {
      try {
        const { data } = await axios.get(
          'https://api.binance.com/api/v3/ticker/price?symbol=MATICETH'
        );
        if (data.price) {
          exchangeRate = Number.parseFloat(data.price);
          this.set('floorPriceExchangeRate', exchangeRate);
          this.set('floorPriceExchangeRateFetchedAt', new Date());
          await this.save();
        }
      } catch (error) {
        exchangeRate = 1;
      }
    } else {
      exchangeRate = this.floorPriceExchangeRate || 1;
    }

    const oldFloorPrice = Number.parseFloat(this.floorPrice);
    if (isNaN(oldFloorPrice)) return this.floorPrice;
    const newFloorPrice = oldFloorPrice * (1 / exchangeRate);
    return newFloorPrice.toString();
  }

  toResponseJSONConcise(): CollectionResponseConcise {
    return {
      id: this.id,
      slug: this.slug,
      name: this.name,
      imageUrl: this.imageUrl,
      bannerImageUrl: this.bannerImageUrl,
    };
  }

  async toResponseJSON(
    myself: User | null = null
  ): Promise<CollectionResponse> {
    const clj = this.toJSON();
    const props = _.pick(clj, [
      'id',
      'contractAddress',
      'slug',
      'name',
      'description',
      'contractSchema',
      'email',
      'blogUrl',
      'redditUrl',
      'facebookUrl',
      'twitterHandle',
      'discordUrl',
      'websiteUrl',
      'telegramUrl',
      'bitcointalkUrl',
      'githubUrl',
      'wechatUrl',
      'linkedInUrl',
      'whitepaperUrl',
      'imageUrl',
      'bannerImageUrl',
      'floorPrice',
      'mintingPriceWl',
      'mintingPricePublic',
      'marketplace',
      'openseaMetadataUpdatedAt',
      'openseaPriceUpdatedAt',
      'infoSource',
    ]);

    const [
      collectionDeployers,
      paymentTokens,
      document,
      category,
      utility,
      blocks,
    ] = await Promise.all([
      this.$get('collectionDeployers', { attributes: ['address'] }),
      this.$get('paymentTokens', {
        attributes: ['id', 'name', 'symbol', 'address', 'imageUrl', 'decimals'],
      }),
      this.$get('document', { attributes: ['id', 'title'] }),
      this.$get('category', { attributes: ['id', 'name'] }),
      this.$get('utility', { attributes: ['id', 'name'] }),
      this.$get('blocks', {
        include: [
          {
            model: User,
            as: 'createdBy',
          },
          {
            model: User,
            as: 'updatedBy',
          },
          Collection,
        ],
      }),
    ]);

    // All the blocks
    const blockResponses = blocks
      ? await Promise.all(blocks.map((blk) => blk.toResponseJSON(myself)))
      : undefined;

    const blkrEntries: [BlockCollectionAttrib, BlockResponse][] | undefined =
      blockResponses?.map((b) => [b.collectionAttrib || '', b]);

    const blockResponse = blkrEntries
      ? (Object.fromEntries<BlockResponse>(blkrEntries) as Record<
          BlockCollectionAttrib,
          BlockResponse
        >)
      : undefined;

    const response: CollectionResponse = {
      ...props,
      collectionDeployers:
        collectionDeployers as CollectionResponse['collectionDeployers'],
      paymentTokens: paymentTokens as CollectionResponse['paymentTokens'],
      document: document as CollectionResponse['document'],
      category: category as CollectionResponse['category'],
      utility: utility as CollectionResponse['utility'],
      blocks: blockResponse,
      floorPrice: await this.getFloorPrice(),
    };

    return response;
  }

  @HasOne(() => Channel, { as: 'channel', foreignKey: 'collectionId' })
  channel: CollectionAttributes['channel'];

  @HasMany(() => DiscordAnnouncement, 'collectionId')
  discordAnnouncements: CollectionAttributes['discordAnnouncements'];

  @HasMany(() => TwitterAnnouncement, 'collectionId')
  twitterAnnouncements: CollectionAttributes['twitterAnnouncements'];
}
