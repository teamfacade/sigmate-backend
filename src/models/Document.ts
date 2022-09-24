import {
  AllowNull,
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import Block, { BlockAttributes } from './Block';
import DocumentAudit from './DocumentAudit';
import Category from './Category';
import User, { UserAttributes, UserPublicResponse } from './User';
import UserDevice, { UserDeviceAttributes } from './UserDevice';
import Collection, {
  CollectionAttributes,
  CollectionResponse,
  CollectionResponseConcise,
} from './Collection';
import Opinion from './Opinion';
import DocumentCategory from './DocumentCategory';
import Nft, { NftAttributes, NftResponse, NftResponseConcise } from './Nft';
import { BlockResponse } from './Block';

export type DocumentIdType = number;
export const documentIdDataTypes = DataType.INTEGER;

export interface DocumentAttributes {
  id: DocumentIdType;
  title: string;
  textContent?: string; // text content of all the blocks in a document
  structure?: BlockAttributes['id'][];
  parentId?: DocumentAttributes['id'];
  parent?: Document;
  children?: Document[];
  blocks?: Block[];
  opinions?: Opinion[];
  categories?: Category[];
  audits?: DocumentAudit[];
  collectionId?: CollectionAttributes['id'];
  collection?: Collection;
  nftId?: NftAttributes['id'];
  nft?: Nft;
  createdByDeviceId?: UserDeviceAttributes['id'];
  createdByDevice?: UserDevice;
  createdById?: UserAttributes['id'];
  createdBy?: User;
  createdAt?: Date;
  updatedByDevice?: UserDevice;
  updatedBy?: User;
  updatedAt?: Date;
  deletedByDevice?: UserDevice;
  deletedBy?: User;
  deletedAt?: Date;
}

export type DocumentCreationAttributes = Optional<DocumentAttributes, 'id'>;

export type DocumentCreationDTO = Pick<
  DocumentCreationAttributes,
  | 'title'
  | 'parentId'
  | 'parent'
  | 'collectionId'
  | 'collection'
  | 'nftId'
  | 'nft'
  | 'createdByDeviceId'
  | 'createdByDevice'
  | 'createdById'
  | 'createdBy'
>;

const documentConciseAttributes = ['id', 'title', 'createdAt', 'updatedAt'];
export interface DocumentResponseConcise
  extends Pick<DocumentAttributes, 'id' | 'title' | 'createdAt' | 'updatedAt'> {
  collection?: CollectionResponseConcise;
  nft?: NftResponseConcise;
}

type DocumentResponseBase = DocumentResponseConcise &
  Pick<DocumentAttributes, 'structure'>;
export interface DocumentResponse extends DocumentResponseBase {
  parent?: DocumentResponseConcise;
  children?: DocumentResponseConcise[]; // limit 50
  blocks?: BlockResponse[];
  // TODO opinions
  // TODO categories
  // TODO audits
  collection?: CollectionResponse;
  nft?: NftResponse;
  createdBy?: UserPublicResponse;
  updatedBy?: UserPublicResponse;
}

@Table({
  tableName: 'documents',
  modelName: 'Document',
  timestamps: true,
  paranoid: true,
  underscored: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class Document extends Model<
  DocumentAttributes,
  DocumentCreationAttributes
> {
  @AllowNull(false)
  @Column(DataType.STRING(191))
  title!: DocumentAttributes['title'];

  @Column(DataType.TEXT)
  textContent?: DocumentAttributes['textContent'];

  @Column(DataType.JSON)
  structure: DocumentAttributes['structure'];

  @BelongsTo(() => Document, 'parentId')
  parent: DocumentAttributes['parent'];

  @HasMany(() => Document, 'parentId')
  children?: DocumentAttributes['children'];

  @HasMany(() => Block, 'documentId')
  blocks: DocumentAttributes['blocks'];

  @HasMany(() => Opinion, 'documentId')
  opinions: DocumentAttributes['opinions'];

  @BelongsToMany(() => Category, () => DocumentCategory)
  categories: DocumentAttributes['categories'];

  @HasMany(() => DocumentAudit, 'documentId')
  audits: DocumentAttributes['audits'];

  @BelongsTo(() => Collection, 'collectionId')
  collection: DocumentAttributes['collection'];

  @BelongsTo(() => Nft, 'nftId')
  nft: DocumentAttributes['nft'];

  @BelongsTo(() => UserDevice, 'createdByDeviceId')
  createdByDevice: DocumentAttributes['createdByDevice'];

  @BelongsTo(() => User, 'createdById')
  createdBy: DocumentAttributes['createdBy'];

  @BelongsTo(() => UserDevice, 'updatedByDeviceId')
  updatedByDevice: DocumentAttributes['updatedByDevice'];

  @BelongsTo(() => User, 'updatedById')
  updatedBy: DocumentAttributes['updatedBy'];

  @BelongsTo(() => UserDevice, 'deletedByDeviceId')
  deletedByDevice: DocumentAttributes['deletedByDevice'];

  @BelongsTo(() => User, 'deletedById')
  deletedBy: DocumentAttributes['deletedBy'];

  async toResponseJSONBase() {
    const collection =
      this.collection || (await this.$get('collection')) || undefined;
    const nft = this.nft || (await this.$get('nft')) || undefined;

    return {
      id: this.id,
      title: this.title,
      collection,
      nft,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  async toResponseJSONConcise(): Promise<DocumentResponseConcise> {
    const base = await this.toResponseJSONBase();
    const { collection, nft } = base;

    const res: DocumentResponseConcise = {
      ...base,
      collection: collection ? collection.toResponseJSONConcise() : undefined,
      nft: nft ? nft.toResponseJSONConcise() : undefined,
    };

    return res;
  }

  async toResponseJSON(myself: User | null = null): Promise<DocumentResponse> {
    const base = await this.toResponseJSONBase();
    const { collection, nft } = base;

    const parent =
      this.parent ||
      (await this.$get('parent', {
        attributes: documentConciseAttributes,
        include: [
          {
            model: Collection,
            attributes: ['id', 'slug', 'name', 'imageUrl', 'bannerImageUrl'],
          },
          {
            model: Nft,
            attributes: ['id', 'contractAddress', 'tokenId', 'imageUrl'],
          },
        ],
      }));
    const children =
      this.children ||
      (await this.$get('children', {
        attributes: documentConciseAttributes,
        include: [
          {
            model: Collection,
            attributes: ['id', 'slug', 'name', 'imageUrl', 'bannerImageUrl'],
          },
          {
            model: Nft,
            attributes: ['id', 'contractAddress', 'tokenId', 'imageUrl'],
          },
        ],
      }));
    const childrenResponse = children
      ? await Promise.all(children.map((d) => d.toResponseJSONConcise()))
      : undefined;
    const blocks = await this.$get('blocks');
    const blocksResponse = blocks
      ? await Promise.all(blocks.map((b) => b.toResponseJSON(myself)))
      : undefined;
    const createdBy = this.createdBy || (await this.$get('createdBy'));
    const updatedBy = this.updatedBy || (await this.$get('updatedBy'));

    const res: DocumentResponse = {
      ...base,
      collection: collection
        ? await collection.toResponseJSON(myself)
        : undefined,
      nft: nft ? await nft.toResponseJSON(myself) : undefined,
      structure: this.structure,
      parent: parent ? await parent.toResponseJSONConcise() : undefined,
      children: childrenResponse,
      blocks: blocksResponse,
      createdBy: createdBy ? await createdBy.toResponseJSONPublic() : undefined,
      updatedBy: updatedBy ? await updatedBy.toResponseJSONPublic() : undefined,
    };

    return res;
  }
}
