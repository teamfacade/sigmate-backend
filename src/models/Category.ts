import {
  AllowNull,
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  HasOne,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import Document from './Document';
import User from './User';
import UserDevice from './UserDevice';

export interface CategoryAttributes {
  id: number;
  name: string;
  parent?: Category; // fk
  template?: Document; // fk. if set, enforce this template to all documents
  creatorDevice: UserDevice; // fk
  creator?: User; // fk
}

export type CategoryCreationAttributes = Optional<CategoryAttributes, 'id'>;

@Table({
  tableName: 'categories',
  modelName: 'Category',
  timestamps: true,
  paranoid: false,
  underscored: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class Category extends Model<
  CategoryAttributes,
  CategoryCreationAttributes
> {
  @AllowNull(false)
  @Column(DataType.STRING(191))
  name!: CategoryAttributes['name'];

  @HasOne(() => Category)
  parent: CategoryAttributes['parent'];

  @HasOne(() => Document)
  template: CategoryAttributes['template'];

  @AllowNull(false)
  @BelongsTo(() => UserDevice)
  creatorDevice!: CategoryAttributes['creatorDevice'];

  @BelongsTo(() => User)
  creator: CategoryAttributes['creator'];

  @BelongsToMany(() => Document, 'documentCategory')
  documents!: Document[];
}
