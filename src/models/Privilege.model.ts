import {
  AllowNull,
  BelongsToMany,
  Column,
  DataType,
  Default,
  IsIn,
  Model,
  Table,
  Unique,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import GroupPrivilege from './GroupPrivilege.model';
import User from './User.model';
import UserGroup from './UserGroup.model';
import UserPrivilege from './UserPrivilege.model';

export interface PrivilegeAttribs {
  id: number;
  name: string; // unique
  adminOnly: boolean;
  users?: User[];
  groups?: UserGroup[];
}

type PrivilegeCAttribs = Optional<PrivilegeAttribs, 'id' | 'adminOnly'>;

export const PRIVILEGES = Object.freeze({
  wiki__viewDocumentContents: { adminOnly: false },
  wiki__viewDocumentHistory: { adminOnly: false },
  wiki__viewAnnouncementDetails: { adminOnly: false },
  wiki__viewVerificationDetails: { adminOnly: false },
  wiki__createDocument: { adminOnly: false },
  wiki__createDocumentNVC: { adminOnly: false },
  wiki__editDocument: { adminOnly: false },
  wiki__verify: { adminOnly: false },
  wiki__report: { adminOnly: false },
  calendar__viewSchedule: { adminOnly: false },
  calendar__viewScheduleDetails: { adminOnly: false },
  calendar__followSchedule: { adminOnly: false },
  stats__viewLeaderboard: { adminOnly: false },
  stats__affectViews: { adminOnly: false },
  stats__affectAnalytics: { adminOnly: false },
  account__login: { adminOnly: false },
  account__connectGoogle: { adminOnly: false },
  account__connectMetamask: { adminOnly: false },
  account__updateMetamask: { adminOnly: false },
  account__connectDiscord: { adminOnly: false },
  account__connectTwitter: { adminOnly: false },
  account__viewOtherProfile: { adminOnly: false },
  account__updateProfile: { adminOnly: false },
  account__deleteAccount: { adminOnly: false },
  rewards__progressMission: { adminOnly: false },
  rewards__recordPoints: { adminOnly: false },
  rewards__receivePoints: { adminOnly: false },
  rewards__receiveReferralPoints: { adminOnly: false },
  rewards__giveReferralPoints: { adminOnly: false },
  rewards__transferTokens: { adminOnly: false },
  forum__viewForum: { adminOnly: false },
  forum__votePost: { adminOnly: false },
  forum__createPost: { adminOnly: false },
  forum__editMyPost: { adminOnly: false },
  forum__deleteMyPost: { adminOnly: false },
  forum__voteComment: { adminOnly: false },
  forum__createComment: { adminOnly: false },
  forum__editMyComment: { adminOnly: false },
  forum__deleteMyComment: { adminOnly: false },
  forum__report: { adminOnly: false },
  wiki__auditDocument: { adminOnly: true },
  wiki__adminContent: { adminOnly: true },
  wiki__adminVerifications: { adminOnly: true },
  wiki__adminMetadata: { adminOnly: true },
  upcoming__adminSchedules: { adminOnly: true },
  forum_adminForum: { adminOnly: true },
  reports__adminReports: { adminOnly: true },
  account__adminUsers: { adminOnly: true },
  rewards__adminPoints: { adminOnly: true },
  rewards__adminTokens: { adminOnly: true },
});

export type PrivilegeName = keyof typeof PRIVILEGES;
export const PRIVILEGE_NAMES = Object.keys(PRIVILEGES) as PrivilegeName[];

@Table({
  tableName: 'privileges',
  modelName: 'Privilege',
  timestamps: false,
  underscored: true,
  paranoid: false,
})
export default class Privilege extends Model<
  PrivilegeAttribs,
  PrivilegeCAttribs
> {
  @Unique('privileges.name')
  @AllowNull(false)
  @IsIn({
    msg: 'INVALID_NAME',
    args: [PRIVILEGE_NAMES],
  })
  @Column(DataType.STRING(64))
  name!: PrivilegeAttribs['name'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  adminOnly!: PrivilegeAttribs['adminOnly'];

  @BelongsToMany(() => User, {
    through: () => UserPrivilege,
    foreignKey: 'privilegeId',
    otherKey: 'userId',
  })
  users: PrivilegeAttribs['users'];

  UserPrivilege?: UserPrivilege; // mixin

  @BelongsToMany(() => UserGroup, {
    through: () => GroupPrivilege,
    foreignKey: 'privilegeId',
    otherKey: 'userGroupId',
    as: 'groups',
  })
  groups: PrivilegeAttribs['groups'];

  GroupPrivilege?: GroupPrivilege; // mixin
}
