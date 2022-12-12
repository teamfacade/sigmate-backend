import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import User from './User.model';
import { UserPrivileges } from './UserGroup.model';

export interface UserAuthAttribs extends UserPrivileges {
  id: number;
  user?: User;
  sigmateAccessTokenIat?: number;
  sigmateRefreshTokenIat?: number;
  googleAccessToken?: string;
  googleRefreshToken?: string;
  metamaskNonce?: string;
}

export type UserAuthCAttribs = Optional<
  UserAuthAttribs,
  'id' | keyof UserPrivileges
>;

@Table({
  tableName: 'user_auths',
  modelName: 'UserAuth',
  underscored: true,
  timestamps: false,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class UserAuth extends Model<UserAuthAttribs, UserAuthCAttribs> {
  @BelongsTo(() => User, {
    as: 'user',
    foreignKey: 'userId',
    onDelete: 'CASCADE',
  })
  user: UserAuthAttribs['user'];

  @Column(DataType.INTEGER)
  sigmateAccessTokenIat: UserAuthAttribs['sigmateAccessTokenIat'];

  @Column(DataType.INTEGER)
  sigmateRefreshTokenIat: UserAuthAttribs['sigmateRefreshTokenIat'];

  @Column(DataType.STRING(512))
  googleAccessToken: UserAuthAttribs['googleAccessToken'];

  @Column(DataType.STRING(512))
  googleRefreshToken: UserAuthAttribs['googleRefreshToken'];

  @Column(DataType.STRING(256))
  metamaskNonce: UserAuthAttribs['metamaskNonce'];

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  canCreateWikiDocument!: UserAuthAttribs['canCreateWikiDocument'];

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  canEditWikiDocument!: UserAuthAttribs['canEditWikiDocument'];

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  canVerify!: UserAuthAttribs['canVerify'];

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  canChangeName!: UserAuthAttribs['canChangeName'];

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  canReport!: UserAuthAttribs['canReport'];

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  canLogin!: UserAuthAttribs['canLogin'];

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  canConnectGoogle!: UserAuthAttribs['canConnectGoogle'];

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  canConnectMetamask!: UserAuthAttribs['canConnectMetamask'];

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  canConnectDiscord!: UserAuthAttribs['canConnectDiscord'];

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  canConnectTwitter!: UserAuthAttribs['canConnectTwitter'];

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  canReceivePoints!: UserAuthAttribs['canReceivePoints'];

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  canTransferToken!: UserAuthAttribs['canTransferToken'];

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  canRefer!: UserAuthAttribs['canRefer'];

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  canParticipateEvent!: UserAuthAttribs['canParticipateEvent'];

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  canVoteForumPost!: UserAuthAttribs['canVoteForumPost'];

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  canCreateForumPost!: UserAuthAttribs['canCreateForumPost'];

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  canEditMyForumPost!: UserAuthAttribs['canEditMyForumPost'];

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  canDeleteMyForumPost!: UserAuthAttribs['canDeleteMyForumPost'];

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  canVoteForumPostComment!: UserAuthAttribs['canVoteForumPostComment'];

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  canCreateFoumPostComment!: UserAuthAttribs['canCreateFoumPostComment'];

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  canEditMyForumPostComment!: UserAuthAttribs['canEditMyForumPostComment'];

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  canDeleteMyForumPostComment!: UserAuthAttribs['canDeleteMyForumPostComment'];

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  canAffectViewCount!: UserAuthAttribs['canAffectViewCount'];

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  canAffectAnalytics!: UserAuthAttribs['canAffectAnalytics'];

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  canAdminWikiDocument!: UserAuthAttribs['canAdminWikiDocument'];

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  canAdminWikiVerify!: UserAuthAttribs['canAdminWikiVerify'];

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  canAdminUpcoming!: UserAuthAttribs['canAdminUpcoming'];

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  canAdminEvent!: UserAuthAttribs['canAdminEvent'];

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  canAdminForum!: UserAuthAttribs['canAdminForum'];

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  canAdminUserGeneral!: UserAuthAttribs['canAdminUserGeneral'];

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  canAdminReports!: UserAuthAttribs['canAdminReports'];

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  canAdminUserPoint!: UserAuthAttribs['canAdminUserPoint'];

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  canAdminUserToken!: UserAuthAttribs['canAdminUserToken'];

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  canAdminDev!: UserAuthAttribs['canAdminDev'];
}
