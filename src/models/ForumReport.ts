import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import ForumComment from './ForumComment';
import ForumPost from './ForumPost';
import User from './User';
import UserDevice from './UserDevice';

export interface ForumReportAttributes {
  id: number;
  reason: number;
  description?: string;
  post?: ForumPost;
  comment?: ForumComment;
  createdBy: User;
  createdByDevice: UserDevice;
  feedbackType?: number;
  feedbackContent?: string;
  feedbackBy?: User;
  feedbackByDevice?: UserDevice;
  deletedBy?: User;
  deletedByDevice?: UserDevice;
}

export type ForumReportCreationAttributes = Optional<
  ForumReportAttributes,
  'id'
>;

@Table({
  modelName: 'ForumReport',
  tableName: 'forum_reports',
  underscored: true,
  timestamps: true,
  paranoid: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class ForumReport extends Model<
  ForumReportAttributes,
  ForumReportCreationAttributes
> {
  @AllowNull(false)
  @Column(DataType.INTEGER)
  reason!: ForumReportAttributes['reason'];

  @Column(DataType.TEXT)
  description: ForumReportAttributes['description'];

  @BelongsTo(() => ForumPost)
  post: ForumReportAttributes['post'];

  @BelongsTo(() => ForumComment)
  comment: ForumReportAttributes['comment'];

  @AllowNull(false)
  @BelongsTo(() => User, 'createdById')
  createdBy!: ForumReportAttributes['createdBy'];

  @AllowNull(false)
  @BelongsTo(() => UserDevice, 'createdByDeviceId')
  createdByDevice!: ForumReportAttributes['createdByDevice'];

  @Column(DataType.INTEGER)
  feedbackType: ForumReportAttributes['feedbackType'];

  @Column(DataType.TEXT)
  feedbackContent: ForumReportAttributes['feedbackContent'];

  @BelongsTo(() => User, 'feedbackById')
  feedbackBy: ForumReportAttributes['feedbackBy'];

  @BelongsTo(() => UserDevice, 'feedbackByDeviceId')
  feedbackByDevice: ForumReportAttributes['feedbackByDevice'];

  @BelongsTo(() => User, 'deletedById')
  deletedBy: ForumReportAttributes['deletedBy'];

  @BelongsTo(() => UserDevice, 'deletedByDeviceId')
  deletedByDevice: ForumReportAttributes['deletedByDevice'];
}
