import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import AdminUser from './AdminUser';
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
  feedback?: string;
  feedbackBy?: AdminUser;
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
  paranoid: false,
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

  @Column(DataType.STRING(255))
  description: ForumReportAttributes['description'];

  @BelongsTo(() => ForumPost)
  post: ForumReportAttributes['post'];

  @BelongsTo(() => ForumComment)
  comment: ForumReportAttributes['comment'];

  @AllowNull(false)
  @BelongsTo(() => User)
  createdBy!: ForumReportAttributes['createdBy'];

  @AllowNull(false)
  @BelongsTo(() => UserDevice)
  createdByDevice!: ForumReportAttributes['createdByDevice'];

  @Column(DataType.INTEGER)
  feedbackType: ForumReportAttributes['feedbackType'];

  @Column(DataType.STRING(255))
  feedback: ForumReportAttributes['feedback'];

  @BelongsTo(() => AdminUser)
  feedbackBy: ForumReportAttributes['feedbackBy'];
}
