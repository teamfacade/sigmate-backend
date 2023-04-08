import {
  AllowNull,
  BelongsToMany,
  Column,
  DataType,
  Default,
  Model,
  Table,
  Unique,
} from 'sequelize-typescript';
import { Collection } from '../chain/Collection.model';
import { CollectionTag } from '../chain/CollectionTag.model';
import { Nft } from '../chain/Nft.model';
import { NftTag } from '../chain/NftTag.model';
import { Optional } from 'sequelize/types';
import WikiDocumentTag from './WikiDocumentTag.model';
import { WikiDocumentSql } from './WikiDocumentSql.model';

export interface WikiTagAttribs {
  id: number;
  name: string;
  isDefault: boolean;
  documents?: WikiDocumentTag[];
  collections?: Collection[];
  nfts?: Nft[];
}

type WikiTagCAttribs = Optional<WikiTagAttribs, 'id' | 'isDefault'>;

@Table({
  modelName: 'WikiTag',
  tableName: 'wiki_tags',
  timestamps: false,
  underscored: true,
  paranoid: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export class WikiTag extends Model<WikiTagAttribs, WikiTagCAttribs> {
  @Unique('nft_tags.name')
  @AllowNull(false)
  @Column(DataType.STRING)
  name!: WikiTagAttribs['name'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  isDefault!: WikiTagAttribs['isDefault'];

  @BelongsToMany(() => WikiDocumentSql, {
    through: () => WikiDocumentTag,
    as: 'documents',
    foreignKey: 'documentId',
    otherKey: 'tagId',
  })
  documents: WikiTagAttribs['documents'];

  @BelongsToMany(() => Collection, {
    through: () => CollectionTag,
    foreignKey: 'tagId',
    otherKey: 'collectionId',
  })
  collections: WikiTagAttribs['collections'];

  @BelongsToMany(() => Nft, {
    through: () => NftTag,
    foreignKey: 'tagId',
    otherKey: 'nftId',
  })
  nfts: WikiTagAttribs['nfts'];
}
