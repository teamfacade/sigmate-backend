import { ValidationChain } from 'express-validator';
import getValidationChain from '../../middlewares/validators';
import UserAuth, {
  UserAuthAttribs,
  UserAuthCAttribs,
} from '../../models/UserAuth.model';
import Action from '../Action';
import ModelService, { ValidateOneOptions } from '../ModelService';
import User from './User';
import { Request } from 'express';
import { Identifier } from 'sequelize/types';
import UserGroup, {
  UserGroupAttribs,
  UserPrivileges,
} from '../../models/UserGroup.model';
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
  check: (action: Action<TPKT, SPKT, PTPKT, PSPKT>) => boolean;
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
  | 'metamaskNonce'
  | 'signature';

export default abstract class Auth extends ModelService<
  UserAuthAttribs,
  UserAuthCAttribs
> {
  /**
   * Entire UserGroup table selected from database.
   * Contains privileges for each UserGroup
   */
  static groupNameMap: Record<UserGroupAttribs['name'], UserGroup> = {};
  static groupIdMap: Record<UserGroupAttribs['id'], UserGroup> = {};

  /**
   * Start Auth service
   */
  static async start() {
    Auth.status = Auth.STATE.STARTING;
    await Auth.loadGroups();
    Auth.status = Auth.STATE.STARTED;
  }

  /**
   * Load the entire UserGroup table from the database
   */
  static async loadGroups(parentAction: Action | undefined = undefined) {
    const action = new Action({
      type: Action.TYPE.DATABASE,
      name: 'AUTH_START_LOAD_GROUPS',
      transaction: false,
      parent: parentAction,
    });
    // Load from DB
    const groups = await action.run(() => UserGroup.findAll());

    // Create maps
    Auth.groupIdMap = {};
    Auth.groupNameMap = {};
    groups.forEach((group) => {
      Auth.groupIdMap[group.id] = group;
      Auth.groupNameMap[group.name] = group;
    });
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
  static isGroup(groupName: keyof typeof Auth['groupNameMap']): Authorizer {
    return {
      name: 'isGroup',
      check: (action) => {
        return (
          action.subject?.model?.toJSON().groupId ===
          Auth.groupNameMap[groupName]?.id
        );
      },
      once: true,
    };
  }

  /**
   * @param privileges A user privilege name, or an array of them.
   * @returns An authorizer that checks whether the action subject has (**ALL** of)
   * the given privilege(s).
   */
  static can(
    privileges: keyof UserPrivileges | (keyof UserPrivileges)[]
  ): Authorizer {
    return {
      name: 'can',
      check: (action) => {
        // Check action is authenticated
        const user = action.subject?.model;
        if (!user) return false;
        const groupId = user.getDataValue('groupId');
        if (!groupId) return false;

        // Chcek group privileges
        const group = Auth.groupIdMap[groupId];
        const privs =
          typeof privileges === 'string' ? [privileges] : privileges;
        for (const priv in privs) {
          if (!group[priv as keyof UserPrivileges]) return false;
        }

        // Check user privileges
        if (!user.checkPrivileges) return true; // No need to check
        const auth = user.auth;
        if (!auth) throw new AuthError({ code: 'AUTH/NF' });
        for (const priv in privs) {
          if (auth[priv as keyof UserPrivileges] === false) {
            return false;
          }
        }

        // If we reached here, authorization success
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

  // TODO Authorize: Check privileges

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
      case 'metamaskNonce':
        return chain.trim().stripLow().notEmpty().withMessage('REQUIRED');
      case 'signature':
        return chain.trim().stripLow().notEmpty().withMessage('REQUIRED');
      default:
        return chain.optional().isEmpty().withMessage('INVALID_FIELD');
    }
  }
}
