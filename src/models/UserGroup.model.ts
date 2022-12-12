import {
  AllowNull,
  Column,
  DataType,
  Default,
  HasMany,
  Model,
  Table,
  Unique,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import User from './User.model';

export interface UserPrivileges {
  // Privileges: Wiki
  canCreateWikiDocument: boolean;
  canEditWikiDocument: boolean;
  canVerify: boolean;

  // Privileges: User
  canChangeName: boolean;
  canReport: boolean;

  canLogin: boolean;
  canConnectGoogle: boolean;
  canConnectMetamask: boolean;
  canConnectDiscord: boolean;
  canConnectTwitter: boolean;

  canReceivePoints: boolean;
  canTransferToken: boolean;
  canRefer: boolean;

  // Privileges: Event
  canParticipateEvent: boolean;

  // Privileges: Forum
  canVoteForumPost: boolean;
  canCreateForumPost: boolean;
  canEditMyForumPost: boolean;
  canDeleteMyForumPost: boolean;
  canVoteForumPostComment: boolean;
  canCreateFoumPostComment: boolean;
  canEditMyForumPostComment: boolean;
  canDeleteMyForumPostComment: boolean;

  // Privileges: Analytics
  /**
   * When set to `false` view counts will not be increased when the user
   * accesses a wiki document or forum post
   */
  canAffectViewCount: boolean;
  /**
   * When set to `false`, analytics logs will not be made for
   * actions that this user performed
   */
  canAffectAnalytics: boolean;

  // Privileges: Admin
  /**
   * * CREATE wiki documents about a collection/NFT that is not on marketplace
   * * EDIT key information
   * * FLAG/PROTECT/HIDE/ARCHIVE/DELETE wiki documents
   * * REVERT wiki documents to old versions
   * * CONFIRM collections
   */
  canAdminWikiDocument: boolean;
  /**
   * * REVERT verifications: Reverted verifications are not counted, but still visible in history
   * * STOP verification: Prevent additional verifications from being made to certain blocks
   */
  canAdminWikiVerify: boolean;
  /**
   * * CREATE/UPDATE/DELETE upcoming minting schedules
   */
  canAdminUpcoming: boolean;
  /**
   * * CREATE/UPDATE/DELETE event details
   * * CANCEL events
   * * VIEW event details of unannounced events
   * * VIEW event participants, their stakes, and whether they won
   * * RUN the VRF to randomly determine the winner of the event
   * * ANNOUNCE the winner of the event
   * * BAN users from participating in all/certian events
   * * IF `canAdminUserToken`, create tx to send tokens to winners
   */
  canAdminEvent: boolean;
  /**
   * * CREATE posts in the announcement category
   * * HIDE/DELETE posts/comments created by other users
   * * REVERT forum acitivites performed by certain users (as if they never happened)
   */
  canAdminForum: boolean;
  /**
   * * VIEW reports submitted by users
   * * REJECT reports (not enough information, fraud reports)
   * * IF `canAdminUserGeneral`: Flag or ban user in response to the report
   * * IF `canAdminForum`: Delete or hide forum posts
   */
  canAdminReports: boolean;
  /**
   * * AUTHORIZE/REVOKE privileges for individual users
   * * FLAG/BAN users and devices
   */
  canAdminUserGeneral: boolean;
  /**
   * * VIEW point logs of other users
   * * APPROVE/REVOKE points given to users
   * * FLAG users to prevent them from receiving points
   */
  canAdminUserPoint: boolean;
  /**
   * APPROVE/REJECT point -> token transfer requests
   */
  canAdminUserToken: boolean;
  /**
   * Access developer features
   */
  canAdminDev: boolean;
}

export interface UserGroupAttribs extends UserPrivileges {
  id: number;
  name: string;
  users?: User[];
}

type UserGroupCAttribs = Optional<
  UserGroupAttribs,
  'id' | keyof UserPrivileges
>;

@Table({
  modelName: 'UserGroup',
  tableName: 'user_groups',
  timestamps: false,
  underscored: true,
  paranoid: false,
})
export default class UserGroup extends Model<
  UserGroupAttribs,
  UserGroupCAttribs
> {
  @AllowNull(false)
  @Unique('user_group.name')
  @Column(DataType.STRING(32))
  name!: UserGroupAttribs['name'];

  @HasMany(() => User, { foreignKey: 'groupId' })
  users: UserGroupAttribs['users'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canCreateWikiDocument!: UserGroupAttribs['canCreateWikiDocument'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canEditWikiDocument!: UserGroupAttribs['canEditWikiDocument'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canVerify!: UserGroupAttribs['canVerify'];

  @Default(true)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canChangeName!: UserGroupAttribs['canChangeName'];

  @Default(true)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canReport!: UserGroupAttribs['canReport'];

  @Default(true)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canLogin!: UserGroupAttribs['canLogin'];

  @Default(true)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canConnectGoogle!: UserGroupAttribs['canConnectGoogle'];

  @Default(true)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canConnectMetamask!: UserGroupAttribs['canConnectMetamask'];

  @Default(true)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canConnectDiscord!: UserGroupAttribs['canConnectDiscord'];

  @Default(true)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canConnectTwitter!: UserGroupAttribs['canConnectTwitter'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canReceivePoints!: UserGroupAttribs['canReceivePoints'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canTransferToken!: UserGroupAttribs['canTransferToken'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canRefer!: UserGroupAttribs['canRefer'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canParticipateEvent!: UserGroupAttribs['canParticipateEvent'];

  @Default(true)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canVoteForumPost!: UserGroupAttribs['canVoteForumPost'];

  @Default(true)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canCreateForumPost!: UserGroupAttribs['canCreateForumPost'];

  @Default(true)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canEditMyForumPost!: UserGroupAttribs['canEditMyForumPost'];

  @Default(true)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canDeleteMyForumPost!: UserGroupAttribs['canDeleteMyForumPost'];

  @Default(true)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canVoteForumPostComment!: UserGroupAttribs['canVoteForumPostComment'];

  @Default(true)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canCreateFoumPostComment!: UserGroupAttribs['canCreateFoumPostComment'];

  @Default(true)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canEditMyForumPostComment!: UserGroupAttribs['canEditMyForumPostComment'];

  @Default(true)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canDeleteMyForumPostComment!: UserGroupAttribs['canDeleteMyForumPostComment'];

  @Default(true)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canAffectViewCount!: UserGroupAttribs['canAffectViewCount'];

  @Default(true)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canAffectAnalytics!: UserGroupAttribs['canAffectAnalytics'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canAdminWikiDocument!: UserGroupAttribs['canAdminWikiDocument'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canAdminWikiVerify!: UserGroupAttribs['canAdminWikiVerify'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canAdminUpcoming!: UserGroupAttribs['canAdminUpcoming'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canAdminEvent!: UserGroupAttribs['canAdminEvent'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canAdminForum!: UserGroupAttribs['canAdminForum'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canAdminUserGeneral!: UserGroupAttribs['canAdminUserGeneral'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canAdminReports!: UserGroupAttribs['canAdminReports'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canAdminUserPoint!: UserGroupAttribs['canAdminUserPoint'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canAdminUserToken!: UserGroupAttribs['canAdminUserToken'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  canAdminDev!: UserGroupAttribs['canAdminDev'];
}
