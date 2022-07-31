import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Default,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import Image from './Image';
import Url from './Url';
import User from './User';
import UserDevice from './UserDevice';

export interface BlockAttributes {
  id: number;
  element: string;
  style: JSON;
  initStructre?: JSON;
  currentStructure?: JSON;
  isTemplate: boolean;
  isFlagged: boolean;
  isBlocked: boolean;
  children?: Block[];
  image?: Image;
  url?: Url;
  creatorDevice: UserDevice;
  creator?: User;
}

export type BlockCreationAttributes = Optional<
  BlockAttributes,
  'id' | 'isTemplate'
>;

@Table({
  tableName: 'blocks',
  modelName: 'Block',
  timestamps: true,
  paranoid: true,
  underscored: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class Block extends Model<
  BlockAttributes,
  BlockCreationAttributes
> {
  @AllowNull(false)
  @Column(DataType.STRING(16))
  element!: BlockAttributes['element'];

  @Column(DataType.JSON)
  style!: BlockAttributes['style'];

  @Column(DataType.JSON)
  initStructure: BlockAttributes['initStructre'];

  @Column(DataType.JSON)
  currentStructure: BlockAttributes['currentStructure'];

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  isTemplate!: BlockAttributes['isTemplate'];

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  isFlagged!: BlockAttributes['isFlagged'];

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  isBlocked!: BlockAttributes['isBlocked'];

  @HasMany(() => Block)
  children!: BlockAttributes['children'];

  @BelongsTo(() => Image)
  image!: BlockAttributes['image'];

  @BelongsTo(() => Url)
  url!: BlockAttributes['url'];

  @BelongsTo(() => UserDevice)
  creatorDevice!: BlockAttributes['creatorDevice'];

  @BelongsTo(() => User)
  creator: BlockAttributes['creator'];
}
