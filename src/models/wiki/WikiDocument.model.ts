import {
  Model,
  Table,
  BelongsTo,
  BelongsToMany,
  PrimaryKey,
  Column,
  DataType,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import { DropletId } from '../../utils/droplet';
import { CollectionAttribs, Collection } from '../chain/Collection.model';
import { NftAttribs, Nft } from '../chain/Nft.model';
import { WikiTag } from './WikiTag.model';
import { User, UserId } from '../User.model';
import { WikiDocumentTag } from './WikiDocumentTag.model';

export interface WikiDocumentAttribs {
  id: DropletId;
  collection?: Collection;
  collectionId?: CollectionAttribs['id'];
  nft?: Nft;
  nftId?: NftAttribs['id'];
  tags?: WikiTag[];
  createdBy?: User;
  createdById?: UserId;
  updatedBy?: User;
  updatedById?: UserId;
}

type WikiDocumentCAttribs = Optional<WikiDocumentAttribs, 'id'>;

@Table({
  modelName: 'WikiDocument',
  tableName: 'wiki_documents',
  timestamps: false,
  underscored: true,
  paranoid: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export class WikiDocument extends Model<
  WikiDocumentAttribs,
  WikiDocumentCAttribs
> {
  @PrimaryKey
  @Column(DataType.STRING(32))
  id!: WikiDocumentAttribs['id'];

  @BelongsTo(() => Collection, { foreignKey: 'collectionId' })
  collection: WikiDocumentAttribs['collection'];

  @BelongsTo(() => Nft, { foreignKey: 'nftId' })
  nft: WikiDocumentAttribs['nft'];

  @BelongsToMany(() => WikiTag, {
    through: () => WikiDocumentTag,
    foreignKey: 'documentId',
    otherKey: 'tagId',
  })
  tags: WikiDocumentAttribs['tags'];

  @BelongsTo(() => User, { foreignKey: 'createdById', as: 'createdBy' })
  createdBy: WikiDocumentAttribs['createdBy'];

  @BelongsTo(() => User, { foreignKey: 'updatedById', as: 'updatedBy' })
  updatedBy: WikiDocumentAttribs['updatedBy'];
}
