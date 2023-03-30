import {
  Model,
  Table,
  BelongsTo,
  BelongsToMany,
  PrimaryKey,
  Column,
  DataType,
  AllowNull,
  Unique,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import { CollectionAttribs, Collection } from '../chain/Collection.model';
import { NftAttribs, Nft } from '../chain/Nft.model';
import { WikiTag } from './WikiTag.model';
import { User, UserId } from '../User.model';
import { WikiDocumentTag } from './WikiDocumentTag.model';

export interface WikiDocumentRelAttribs {
  id: sigmate.Wiki.DocumentId;
  title: string;
  collection?: Collection;
  collectionId?: CollectionAttribs['id'];
  nft?: Nft;
  nftId?: NftAttribs['id'];
  tags?: WikiTag[];
  createdBy?: User;
  createdById?: UserId;
}

type WikiDocumentRelCAttribs = Optional<WikiDocumentRelAttribs, 'id'>;

@Table({
  modelName: 'WikiDocumentRel',
  tableName: 'wiki_document_rels',
  timestamps: false,
  underscored: true,
  paranoid: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export class WikiDocumentRel extends Model<
  WikiDocumentRelAttribs,
  WikiDocumentRelCAttribs
> {
  @PrimaryKey
  @Column(DataType.STRING(32))
  id!: WikiDocumentRelAttribs['id'];

  @Unique('wiki_document_rels.title')
  @AllowNull(false)
  @Column(DataType.STRING(191))
  title!: WikiDocumentRelAttribs['title'];

  @BelongsTo(() => Collection, { foreignKey: 'collectionId' })
  collection: WikiDocumentRelAttribs['collection'];

  @BelongsTo(() => Nft, { foreignKey: 'nftId' })
  nft: WikiDocumentRelAttribs['nft'];

  @BelongsToMany(() => WikiTag, {
    through: () => WikiDocumentTag,
    foreignKey: 'documentId',
    otherKey: 'tagId',
  })
  tags: WikiDocumentRelAttribs['tags'];

  @BelongsTo(() => User, { foreignKey: 'createdById', as: 'createdBy' })
  createdBy: WikiDocumentRelAttribs['createdBy'];
}
