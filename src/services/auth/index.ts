import { ValidationChain } from 'express-validator';
import { Request } from 'express';
import { Identifier } from 'sequelize/types';
import { fromPairs } from 'lodash';
import getValidationChain from '../../middlewares/validators';
import ModelService, {
  ValidateOneOptions,
  ValidateOptions,
} from '../ModelService';
import Action, { ActionMetricLike } from '../Action';
import User from './User';
import UserAuth, {
  UserAuthAttribs,
  UserAuthCAttribs,
} from '../../models/UserAuth.model';
import UserGroup, {
  GroupName,
  UserGroupAttribs,
} from '../../models/UserGroup.model';
import Privilege, {
  PrivilegeName,
  PRIVILEGE_NAMES,
} from '../../models/Privilege.model';
import { AuthError } from '../errors/AuthError';

export type AuthOptions = {
  user?: User;
  auth?: UserAuth;
};

export type AuthenticateDTO = {
  google?: {
    /**
     * Set to `true` if an existing, already logged in user is trying to
     * connect this service. During the action, when the user is not found,
     * the action will fail instead of creating a new user.
     *
     * Set to `false` or leave it `undefined` to perform signup or login.
     */
    connect?: boolean;
    code: string;
  };
  metamask?: {
    /**
     * Set to `true` if an existing, already logged in user is trying to
     * connect this service. During the action, when the user is not found,
     * the action will fail instead of creating a new user.
     *
     * Set to `false` or leave it `undefined` to perform signup or login.
     */
    connect?: boolean;
    walletAddress: string;
    signature?: string;
  };
};

export type AuthenticateResponse = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

export type AuthIsMeDTO = {
  req: Request;
};

export type AuthorizeDTO = {
  action: Action;
};

export type Authorizer<
  MetricType extends ActionMetricLike = number,
  TPKT extends Identifier = number,
  SPKT extends Identifier = number,
  PTPKT extends Identifier = TPKT,
  PSPKT extends Identifier = SPKT
> = {
  /**
   * Unique name for the authorizer. The name needs to be **unique across
   * the entire service** as this attribute is used to check whether the
   * same authorizer has already been run by the parent
   */
  name: string;
  /**
   * Function that returns `true` to authorize the action and proceed,
   * `false` to stop and fail the action.
   * @params action Action instance to check authorization
   */
  check: (action: Action<MetricType, TPKT, SPKT, PTPKT, PSPKT>) => boolean;
  /**
   * If set to `true`, child actions will not run this authorizer
   * again if the parent already ran it
   */
  once: boolean;
  /**
   * If set to `true`, this authorizer will run **AFTER** the action is
   * completed, right before the result is returned to the caller.
   *
   * If set to `false` or left `undefined`, the authorizer will run
   * **BEFORE** the action is run.
   */
  after?: boolean;
};

type AuthValidateField =
  | 'refreshToken'
  | 'code'
  | 'nonce'
  | 'walletAddress'
  | 'signature';

export type PrivilegeMap = Record<PrivilegeName, boolean | null>;
export default abstract class Auth extends ModelService<
  UserAuthAttribs,
  UserAuthCAttribs
> {
  /**
   * Entire UserGroup table selected from database.
   * Contains privileges for each UserGroup
   */
  static groupNameMap: Partial<Record<GroupName, UserGroup>> = {};
  static groupIdMap: Record<UserGroupAttribs['id'], UserGroup> = {};
  static groupsFetching = false;
  static groupsFetchedAt?: Date;
  static GROUPS_FETCH_INTERVAL = 5 * 60 * 1000; // 5 minutes

  static getGroup(dto: { id?: UserGroupAttribs['id']; name?: GroupName }) {
    let group: UserGroup | undefined = undefined;
    if (dto.id) {
      group = Auth.groupIdMap[dto.id];
    } else if (dto.name) {
      group = Auth.groupNameMap[dto.name];
    }
    if (!group) {
      throw new AuthError({ code: 'AUTH/NF_USER_GROUP' });
    }
    if (Auth.groupsFetchedAt) {
      const lastFetched = Auth.groupsFetchedAt?.getTime() || 0;
      if (Date.now() - lastFetched > Auth.GROUPS_FETCH_INTERVAL) {
        Auth.fetchGroups(); // asynchronously fetch, but don't await
      }
    }
    return group;
  }

  /**
   * Start Auth service
   */
  static async start() {
    Auth.status = Auth.STATE.STARTING;
    await Auth.fetchGroups();
    Auth.status = Auth.STATE.STARTED;
  }

  static buildPrivilegeMap(
    privileges: Privilege[] | undefined,
    type: 'user' | 'group'
  ) {
    if (!privileges) privileges = [];
    const privilegeMap: PrivilegeMap = fromPairs(
      PRIVILEGE_NAMES.map((name) => [name, null])
    ) as PrivilegeMap;

    switch (type) {
      case 'group':
        privileges.forEach((p) => {
          if (p.GroupPrivilege?.grant === true) {
            privilegeMap[p.name as PrivilegeName] = true;
          } else if (p.GroupPrivilege?.grant === false) {
            privilegeMap[p.name as PrivilegeName] = false;
          } else {
            privilegeMap[p.name as PrivilegeName] = false;
          }
        });
        break;
      case 'user':
        privileges.forEach((p) => {
          if (p.UserPrivilege?.grant === true) {
            privilegeMap[p.name as PrivilegeName] = true;
          } else if (p.UserPrivilege?.grant === false) {
            privilegeMap[p.name as PrivilegeName] = false;
          }
        });
        break;
    }
    return privilegeMap;
  }

  /**
   * Load the entire UserGroup table from the database
   */
  static async fetchGroups(parentAction: Action | undefined = undefined) {
    if (Auth.groupsFetching) return;
    Auth.groupsFetching = true;
    const action = new Action({
      type: Action.TYPE.DATABASE,
      name: 'AUTH_START_LOAD_GROUPS',
      transaction: false,
      parent: parentAction,
    });
    // Load from DB
    const groups = await action.run(() =>
      UserGroup.scope('privileges').findAll()
    );

    // Create maps
    Auth.groupIdMap = {};
    Auth.groupNameMap = {};
    groups.forEach((group) => {
      Auth.groupIdMap[group.id] = group;
      Auth.groupNameMap[group.name as GroupName] = group;
    });
    Auth.groupsFetchedAt = new Date();
    Auth.groupsFetching = false;
  }

  /**
   * @returns An authorizer that checks whether the action target id
   * matches the action subject's id
   */
  static isMe(): Authorizer {
    return {
      name: 'isMe',
      check: (action) => {
        return action.subject?.model?.id === action.target?.id;
      },
      once: true,
    };
  }

  /**
   * @returns An authorizer that checks if the subject of the action exists
   */
  static isLoggedIn(): Authorizer {
    return {
      name: 'isLoggedIn',
      check: (action) => {
        return Boolean(action.subject?.model?.id);
      },
      once: true,
    };
  }

  /**
   * @returns An authorizer that checkes whether the action subject's
   * isAdmin attribute is true
   */
  static isAdmin(): Authorizer {
    return {
      name: 'isAdmin',
      check: (action) => action.subject?.model?.isAdmin || false,
      once: true,
    };
  }

  /**
   * @returns An authorizer that checkes whether the action subject's
   * isTester attribute is true
   */
  static isTester(): Authorizer {
    return {
      name: 'isTester',
      check: (action) => action.subject?.model?.isTester || false,
      once: true,
    };
  }

  /**
   * @param attrib Name of the attribute to check
   * @returns An authorizer that checks whether the action subject id
   * matches the action target instance's attribute
   */
  static isMine(attrib = 'createdBy'): Authorizer {
    return {
      name: 'isMine',
      check: (action) => {
        if (action.target?.instance) {
          const a = attrib as keyof NonNullable<
            NonNullable<typeof action['target']>['instance']
          >;
          return action.subject?.model?.id === action.target?.instance[a];
        }
        return false;
      },
      once: false,
      after: true, // Run after the action has finished
    };
  }

  /**
   * @param groupName Name of a UserGroup
   * @returns An authorizer that checks whether the action subject is
   * of the group with the given group name
   */
  static isGroup(groupName: GroupName): Authorizer {
    return {
      name: 'isGroup',
      check: (action) => {
        return (
          action.subject?.model?.toJSON().groupId ===
          Auth.getGroup({ name: groupName }).id
        );
      },
      once: true,
    };
  }

  /**
   * @param privileges A user privilege name, or an array of them.
   * @returns An authorizer that checks whether the action subject has (**ALL** of)
   * the given privilege(s) granted.
   */
  static can(privileges: PrivilegeName | PrivilegeName[]): Authorizer {
    return {
      name: 'can',
      check: (action) => {
        // Check action is authenticated
        const user = action.subject?.model;
        let group: UserGroup | undefined = undefined;

        // Make privileges an array
        if (!(privileges instanceof Array)) privileges = [privileges];

        // User privilege overrides (for authenticated actions)
        const userOverrides: Partial<Record<PrivilegeName, boolean | null>> =
          {};
        privileges.forEach((pname) => {
          userOverrides[pname] = null;
        });

        if (user) {
          // Authenticated
          // User's group
          const groupId = user.getDataValue('groupId');
          if (!groupId) {
            throw new AuthError({
              code: 'AUTH/NA_USER_GROUP',
              message: 'Group not set for the user',
            });
          }

          // Check user's privilege overrides first
          const userPrivileges = Auth.buildPrivilegeMap(
            user.privileges,
            'user'
          );
          for (const i in privileges) {
            const privilege: PrivilegeName = privileges[i];
            if (userPrivileges[privilege] === true) {
              // User overrides take precedence over group privileges
              userOverrides[privilege] = true;
            } else if (userPrivileges[privilege] === false) {
              // If the user has the privilege revoked,
              // unauthorize no matter the UserGroup settings
              throw new AuthError({
                code: 'AUTH/RJ_USER_UNAUTHORIZED',
                message: `(${privilege})`,
              });
            }
          }

          // Subject group is user's group
          group = Auth.getGroup({ id: groupId });
        } else {
          // Unauthenticated
          // Subject group is 'undefined'
          group = Auth.getGroup({ name: 'unauthenticated' });
        }

        if (!group) {
          throw new AuthError({
            code: 'AUTH/NA_USER_GROUP',
            message: 'Auth service cannot identify user group',
          });
        }

        // Privilege of the group
        const groupPrivileges = group.privilegeMap;
        if (!groupPrivileges) {
          throw new AuthError({ code: 'AUTH/NA_GROUP_PRIV' });
        }

        // Check if the privilege is granted to the group
        for (const i in privileges) {
          const privilege: PrivilegeName = privileges[i];
          // If there are no overrides,
          if (userOverrides[privilege] === null) {
            // and the privilege is not granted to the group,
            if (!groupPrivileges[privilege]) {
              // ...then unauthorized!
              throw new AuthError({
                code: 'AUTH/RJ_GROUP_UNAUTHORIZED',
                message: `(${privilege})`,
              });
            }
          }
        }

        return true;
      },
      once: false,
    };
  }

  name = 'AUTH';
  user: User;
  model?: UserAuth;
  get serviceStatus() {
    return Auth.status;
  }
  get found() {
    return Boolean(this.model);
  }
  constructor(options: AuthOptions = {}) {
    super();
    const { user, auth } = options;
    this.model = user?.model?.auth || auth;
    this.user = user || new User();
  }

  public abstract authenticate(
    dto: AuthenticateDTO,
    parentAction: Action | undefined
  ): Promise<AuthenticateResponse>;

  public static validateOne(
    options: ValidateOneOptions<AuthValidateField>
  ): ValidationChain {
    const { chain, field } = options;
    switch (field) {
      // TOKEN
      case 'refreshToken':
        return getValidationChain('jwt', chain);

      // GOOGLE
      case 'code': // OAuth authorization code
        return chain.trim().stripLow().notEmpty().withMessage('REQUIRED');

      // METAMASK
      case 'walletAddress':
        return chain.isEthereumAddress().withMessage('INVALID_ETH_ADDR');
      case 'nonce':
        return chain
          .trim()
          .notEmpty()
          .withMessage('REQUIRED')
          .isLength({ min: 256, max: 256 });
      case 'signature':
        return chain.trim().notEmpty().withMessage('REQUIRED');
      default:
        return chain.optional().isEmpty().withMessage('INVALID_FIELD');
    }
  }

  public static validate(
    options: ValidateOptions<AuthValidateField>
  ): ValidationChain[] {
    return ModelService.validate(options);
  }
}
