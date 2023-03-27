import { Model, Table, ForeignKey, Column } from 'sequelize-typescript';
import { CollectionAttribs, Collection } from './Collection.model';
import { WikiTagAttribs, WikiTag } from '../wiki/WikiTag.model';

/** Through table between WikiTag and Collection */
@Table({
  modelName: 'CollectionTag',
  tableName: 'collection_tags',
  timestamps: false,
  underscored: true,
  paranoid: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export class CollectionTag extends Model {
  @ForeignKey(() => Collection)
  @Column
  collectionId!: CollectionAttribs['id'];

  @ForeignKey(() => WikiTag)
  @Column
  tagId!: WikiTagAttribs['id'];
}
