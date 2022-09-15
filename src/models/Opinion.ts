import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import Block from './Block';
import BlockVerification from './BlockVerification';
import Document from './Document';
import OpinionVerification from './OpinionVerification';
import UrlVerification from './UrlVerification';
import User from './User';
import UserDevice from './UserDevice';

export interface OpinionAttributes {
  id: number;
  title?: string;
  content: string;
  document?: Document;
  block?: Block;
  blockVerification?: BlockVerification;
  opinionVerification?: OpinionVerification;
  urlVerification?: UrlVerification;
  opinionVerifications?: OpinionVerification[]; // verifications made on this opinion
  createdByDevice: UserDevice;
  createdBy?: User;
  createdAt: Date;
}

export type OpinionCreationAttributes = Optional<
  OpinionAttributes,
  'id' | 'createdAt'
>;

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

  @BelongsTo(() => Document, 'documentId')
  document: OpinionAttributes['document'];

  @BelongsTo(() => Block, 'blockId')
  block: OpinionAttributes['block'];

  @BelongsTo(() => BlockVerification, 'blockVerificationId')
  blockVerification: OpinionAttributes['blockVerification'];

  @BelongsTo(() => OpinionVerification, 'verificationOpinionId')
  opinionVerification: OpinionAttributes['opinionVerification'];

  @BelongsTo(() => UrlVerification, 'urlVerificationId')
  urlVerification: OpinionAttributes['urlVerification'];

  // verifications made to this opinion
  @HasMany(() => OpinionVerification, 'subjectId')
  opinionVerifications: OpinionAttributes['opinionVerifications'];

  @BelongsTo(() => UserDevice, 'createdByDeviceId')
  createdByDevice!: OpinionAttributes['createdByDevice'];

  @BelongsTo(() => User, 'createdById')
  createdBy: OpinionAttributes['createdBy'];
}
