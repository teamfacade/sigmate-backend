import { without } from 'lodash';
import { Transaction } from 'sequelize/types';
import Privilege, {
  PrivilegeName,
  PRIVILEGES,
  PRIVILEGE_NAMES,
} from '../models/Privilege.model';
import UserGroup, { GroupName, GROUP_NAMES } from '../models/UserGroup.model';

export const initializePrivileges = async (
  transaction: Transaction | undefined = undefined
) => {
  const privileges: Privilege[] = [];
  for (const name in PRIVILEGES) {
    const { adminOnly } = PRIVILEGES[name as keyof typeof PRIVILEGES];
    const [privilege] = await Privilege.findOrCreate({
      where: { name },
      defaults: {
        name,
        adminOnly: adminOnly || false,
      },
      transaction,
    });
    privileges.push(privilege);
  }
  return privileges;
};

export const initializeGroups = async (
  transaction: Transaction | undefined = undefined
) => {
  const groups: UserGroup[] = [];
  for (const i in GROUP_NAMES) {
    const name = GROUP_NAMES[i];
    const [group] = await UserGroup.findOrCreate({
      where: { name },
      defaults: { id: Number.parseInt(i) + 1, name },
      transaction,
    });
    groups.push(group);
  }
  return groups;
};

export const initializeGroupPrivileges = async (
  transaction: Transaction | undefined = undefined
) => {
  const privileges = await initializePrivileges(transaction);
  const groups = await initializeGroups(transaction);

  const groupPrivileges: Record<GroupName, Set<PrivilegeName>> = {
    unauthenticated: new Set([
      'wiki__viewDocumentContents',
      'wiki__viewDocumentHistory',
      'calendar__viewSchedule',
      'stats__viewLeaderboard',
      'stats__affectViews',
      'stats__affectAnalytics',
      'account__viewOtherProfile',
      'forum__viewForum',
    ]),
    banned: new Set(['wiki__viewDocumentContents', 'account__login']),
    flagged: new Set([
      'wiki__viewDocumentContents',
      'wiki__viewDocumentHistory',
      'wiki__viewAnnouncementDetails',
      'wiki__viewVerificationDetails',
      'wiki__report',
      'calendar__viewSchedule',
      'calendar__viewScheduleDetails',
      'calendar__followSchedule',
      'stats__viewLeaderboard',
      'stats__affectViews',
      'stats__affectAnalytics',
      'account__login',
      'account__connectGoogle',
      'account__connectMetamask',
      'account__connectDiscord',
      'account__connectTwitter',
      'account__viewOtherProfile',
      'rewards__progressMission',
      'rewards__recordPoints',
      'forum__viewForum',
      'forum__createPost',
      'forum__createComment',
      'forum__report',
    ]),
    inactive: new Set([
      'account__login',
      'rewards__recordPoints',
      'rewards__receiveReferralPoints',
    ]),
    newbie: new Set(
      without(
        PRIVILEGE_NAMES,
        'wiki__createDocument',
        'wiki__createDocumentNVC',
        'wiki__editDocument',
        'rewards__receivePoints',
        'rewards__receiveReferralPoints',
        'rewards__giveReferralPoints',
        'rewards__transferTokens',
        'forum__editMyComment',
        'forum__editMyPost',
        'wiki__auditDocument',
        'wiki__adminContent',
        'wiki__adminVerifications',
        'wiki__adminMetadata',
        'upcoming__adminSchedules',
        'forum_adminForum',
        'reports__adminReports',
        'account__adminUsers',
        'rewards__adminPoints',
        'rewards__adminTokens'
      )
    ),
    active: new Set(
      without(
        PRIVILEGE_NAMES,
        'wiki__createDocumentNVC',
        'wiki__auditDocument',
        'wiki__adminContent',
        'wiki__adminVerifications',
        'wiki__adminMetadata',
        'upcoming__adminSchedules',
        'forum_adminForum',
        'reports__adminReports',
        'account__adminUsers',
        'rewards__adminPoints',
        'rewards__adminTokens'
      )
    ),
    certified: new Set(
      without(
        PRIVILEGE_NAMES,
        'wiki__auditDocument',
        'wiki__adminContent',
        'wiki__adminVerifications',
        'wiki__adminMetadata',
        'upcoming__adminSchedules',
        'forum_adminForum',
        'reports__adminReports',
        'account__adminUsers',
        'rewards__adminPoints',
        'rewards__adminTokens'
      )
    ),
    admin: new Set(PRIVILEGE_NAMES),
  };

  for (const i in groups) {
    const group = groups[i];
    const groupPrivilege = groupPrivileges[group.name as GroupName];
    for (const j in privileges) {
      const privilege = privileges[j];
      const grant = groupPrivilege.has(privilege.name as PrivilegeName);
      await group.$add('privileges', privilege, {
        through: { grant },
        transaction,
      });
    }
  }
};
