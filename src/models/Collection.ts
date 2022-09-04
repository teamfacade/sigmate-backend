import {
  AllowNull,
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  HasMany,
  HasOne,
  Model,
  Table,
  Unique,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import BcToken from './BcToken';
import CollectionDeployer from './CollectionDeployer';
import CollectionPaymentToken from './CollectionPaymentToken';
import CollectionType from './CollectionType';
import CollectionUtility from './CollectionUtility';
import Document from './Document';
import MintingSchedule from './MintingSchedule';
import Nft from './Nft';
import User from './User';
import UserDevice from './UserDevice';

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
  document?: Document;
  createdBy?: User;
  createdByDevice?: UserDevice;
  updatedBy?: User;
  updatedByDevice?: UserDevice;
  mintingSchedules?: MintingSchedule[];
  type: CollectionType;
  utility: CollectionUtility;
  marketplace: string;
  nfts: Nft[];
  openseaUpdatedAt?: Date;
}

export type CollectionCreationAttributes = Optional<CollectionAttributes, 'id'>;

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

  @AllowNull(false)
  @Column(DataType.STRING(10))
  contractSchema!: CollectionAttributes['contractSchema'];

  @Column(DataType.STRING(191))
  email: CollectionAttributes['email'];

  @Column(DataType.STRING(1024))
  blogUrl: CollectionAttributes['blogUrl'];

  @Column(DataType.STRING(1024))
  redditUrl: CollectionAttributes['redditUrl'];

  @Column(DataType.STRING(1024))
  facebookUrl: CollectionAttributes['facebookUrl'];

  @Column(DataType.STRING(1024))
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

  @HasMany(() => MintingSchedule, 'collectionId')
  mintingSchedules: CollectionAttributes['mintingSchedules'];

  @BelongsTo(() => CollectionType, 'collectionTypeId')
  type!: CollectionAttributes['type'];

  @BelongsTo(() => CollectionUtility, 'collectionUtilityId')
  utility!: CollectionAttributes['utility'];

  @AllowNull(false)
  @Column(DataType.STRING(191))
  marketplace!: CollectionAttributes['marketplace'];

  @HasMany(() => Nft, 'collectionId')
  nfts!: CollectionAttributes['nfts'];

  @Column(DataType.DATE)
  openseaUpdatedAt: CollectionAttributes['openseaUpdatedAt'];
}
