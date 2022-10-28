import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  HasOne,
  Model,
  Table,
  Unique,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import Collection, {
  CollectionAttributes,
  CollectionResponse,
} from './Collection';
import Document from './Document';
import User from './User';
import UserDevice from './UserDevice';

export interface NftAttributes {
  id: number;
  collectionId?: CollectionAttributes['id'];
  collection?: Collection;
  contractAddress: string;
  tokenId: number;
  imageUrl?: string;
  document?: Document;
  createdBy?: User;
  createdByDevice?: UserDevice;
}

export type NftCreationAttributes = Optional<NftAttributes, 'id'>;

export interface NftResponse
  extends Pick<
    NftAttributes,
    'id' | 'contractAddress' | 'tokenId' | 'imageUrl'
  > {
  collection?: CollectionResponse;
}

export type NftResponseConcise = Omit<NftResponse, 'collection'>;

@Table({
  tableName: 'nfts',
  modelName: 'Nft',
  timestamps: true,
  underscored: true,
})
export default class Nft extends Model<NftAttributes, NftCreationAttributes> {
  @BelongsTo(() => Collection, 'collectionId')
  collection: NftAttributes['collection'];

  @Unique('token')
  @AllowNull(false)
  @Column(DataType.STRING(64))
  contractAddress!: NftAttributes['contractAddress'];

  @Unique('token')
  @AllowNull(false)
  @Column(DataType.INTEGER)
  tokenId!: NftAttributes['tokenId'];

  @Column(DataType.STRING(1024))
  imageUrl: NftAttributes['imageUrl'];

  @HasOne(() => Document, 'nftId')
  document: NftAttributes['document'];

  @BelongsTo(() => User, 'createdById')
  createdBy: NftAttributes['createdBy'];

  @BelongsTo(() => UserDevice, 'createdByDeviceId')
  createdByDevice: NftAttributes['createdByDevice'];

  toResponseJSONConcise(): NftResponseConcise {
    return {
      id: this.id,
      contractAddress: this.contractAddress,
      tokenId: this.tokenId,
      imageUrl: this.imageUrl,
    };
  }

  async toResponseJSON(myself: User | null = null): Promise<NftResponse> {
    const cl = this.collection || (await this.$get('collection')) || undefined;
    const clr = cl ? await cl.toResponseJSON(myself) : undefined;

    const res: NftResponse = {
      ...this.toResponseJSONConcise(),
      collection: clr,
    };

    return res;
  }
}
