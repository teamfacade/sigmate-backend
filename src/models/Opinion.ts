import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import Block from './Block';
import Document from './Document';
import User from './User';
import UserDevice from './UserDevice';

export interface OpinionAttributes {
  id: number;
  title?: string;
  content: string;
  document?: Document;
  block?: Block;
  verification?: any; // TODO
  creatorDevice: UserDevice;
  creator?: User;
}

export type OpinionCreationAttributes = Optional<OpinionAttributes, 'id'>;

@Table({
  tableName: 'opinions',
  modelName: 'Opinion',
  timestamps: true,
  paranoid: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class Opinion extends Model<
  OpinionAttributes,
  OpinionCreationAttributes
> {
  @Column(DataType.STRING(255))
  title: OpinionAttributes['title'];

  @AllowNull(false)
  @Column(DataType.TEXT)
  content!: OpinionAttributes['content'];

  @BelongsTo(() => Document)
  document: OpinionAttributes['document'];

  @BelongsTo(() => Block)
  block: OpinionAttributes['block'];

  // TODO verification

  @BelongsTo(() => UserDevice)
  creatorDevice!: OpinionAttributes['creatorDevice'];

  @BelongsTo(() => User)
  creator: OpinionAttributes['creator'];
}
