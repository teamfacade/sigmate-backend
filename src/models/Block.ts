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
import BlockAudit from './BlockAudit';
import Document from './Document';
import Image from './Image';
import Url from './Url';
import User from './User';
import UserDevice from './UserDevice';

export type BlockIdType = number;
export interface BlockAttributes {
  id: BlockIdType;
  document: Document;
  element: string;
  isInitial: boolean;
  style: string;
  textContent?: string;
  image?: Image;
  url?: Url;
  structure?: string;
  parent?: Block;
  children?: Block[];
  initialBlock: Block;
  audits?: BlockAudit[];
  creatorDevice: UserDevice;
  creator?: User;
  deletedBy?: User;
}

export type BlockCreationAttributes = Optional<
  BlockAttributes,
  'id' | 'isInitial'
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
  @BelongsTo(() => Document)
  document!: BlockAttributes['document']; // cannot edit after creation

  @AllowNull(false)
  @Column(DataType.STRING(16))
  element!: BlockAttributes['element'];

  // Create two entries on block creation
  // Keep initial one as is and only update the other
  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  isInitial!: BlockAttributes['isInitial'];

  @Column(DataType.TEXT)
  // style!: BlockAttributes['style'];
  get style() {
    const stringified = this.getDataValue('style');
    if (stringified) {
      return JSON.parse(stringified);
    }
    return {};
  }
  set style(value: { [key: string]: string }) {
    try {
      this.setDataValue('style', JSON.stringify(value));
    } catch (error) {
      console.error(error); // TODO
      throw new Error('ERR_MODEL_BLOCK_STYLE');
    }
  }

  // A text block (no children)
  @Column(DataType.TEXT)
  textContent!: BlockAttributes['textContent'];

  // An image block (no children)
  @BelongsTo(() => Image)
  image!: BlockAttributes['image'];

  // An url block (no children)
  @BelongsTo(() => Url)
  url!: BlockAttributes['url'];

  // Has children blocks (1D array)
  @Column(DataType.TEXT)
  get structure() {
    const stringified = this.getDataValue('structure');
    if (!stringified) return [];
    return JSON.parse(stringified);
  }
  set structure(value: BlockIdType[]) {
    try {
      this.setDataValue('structure', JSON.stringify(value));
    } catch (error) {
      console.error(error);
      throw new Error('ERR_MODEL_BLOCK_SET_STRUCTURE');
    }
  }

  @BelongsTo(() => Block, 'parentId')
  parent: BlockAttributes['parent'];

  @HasMany(() => Block, 'parentId')
  children: BlockAttributes['children'];

  @BelongsTo(() => Block, 'initialBlockId')
  initialBlock!: BlockAttributes['initialBlock'];

  @HasMany(() => BlockAudit)
  audits: BlockAttributes['audits'];

  @BelongsTo(() => UserDevice)
  creatorDevice!: BlockAttributes['creatorDevice'];

  @BelongsTo(() => User, 'creatorId')
  creator: BlockAttributes['creator'];

  @BelongsTo(() => User, 'deletedById')
  deletedBy: BlockAttributes['deletedBy'];
}
