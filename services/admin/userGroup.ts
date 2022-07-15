import { body, CustomValidator, query } from 'express-validator';
import { UniqueConstraintError } from 'sequelize';
import UserGroup, {
  GroupIdType,
  GROUP_ID_MAX_LENGTH,
  UserGroupCreationAttributes,
} from '../../models/UserGroup';
import db from '../../models';
import NotFoundError from '../../utilities/NotFoundError';
import ApiError from '../../utilities/ApiError';

/**
 * Check if given group Id is available (CustomValidator for express-validator)
 * @param groupId Id of the user group
 * @returns No return value if Id is available
 * @throws ERR_DUPLICATE when Id is already in use
 */
export const isValidGroupId: CustomValidator = (groupId) => {
  return UserGroup.findByPk(groupId).then((userGroup) => {
    if (userGroup) throw new Error('ERR_DUPLICATE');
  });
};

export const validateGetUserGroupRequest = [
  query('groupId')
    .optional()
    .escape()
    .isLength({ max: GROUP_ID_MAX_LENGTH })
    .withMessage('ERR_LENGTH_LONG')
    .bail()
    .isLength({ min: 1 })
    .withMessage('ERR_LENGTH_SHORT'),
  query('canCreateDocument')
    .optional()
    .escape()
    .isBoolean()
    .withMessage('ERR_NOT_BOOL')
    .toBoolean(true),
  query('canRequestDocumentEdit')
    .optional()
    .escape()
    .isBoolean()
    .withMessage('ERR_NOT_BOOL')
    .toBoolean(true),
  query('canEditDocument')
    .optional()
    .escape()
    .isBoolean()
    .withMessage('ERR_NOT_BOOL')
    .toBoolean(true),
  query('canVerify')
    .optional()
    .escape()
    .isBoolean()
    .withMessage('ERR_NOT_BOOL')
    .toBoolean(true),
  query('canReceivePoints')
    .optional()
    .escape()
    .isBoolean()
    .withMessage('ERR_NOT_BOOL')
    .toBoolean(true),
  query('canTransferToken')
    .optional()
    .escape()
    .isBoolean()
    .withMessage('ERR_NOT_BOOL')
    .toBoolean(true),
  query('canReceiveReferrals')
    .optional()
    .escape()
    .isBoolean()
    .withMessage('ERR_NOT_BOOL')
    .toBoolean(true),
  query('canParticipateEvent')
    .optional()
    .escape()
    .isBoolean()
    .withMessage('ERR_NOT_BOOL')
    .toBoolean(true),
];

export const validateUpdateUserGroupRequest = [
  query('groupId')
    .notEmpty()
    .withMessage('ERR_REQUIRED')
    .bail()
    .escape()
    .isLength({ max: GROUP_ID_MAX_LENGTH })
    .withMessage('ERR_LENGTH_LONG')
    .bail()
    .isLength({ min: 1 })
    .withMessage('ERR_LENGTH_SHORT'),
  query('canCreateDocument')
    .optional()
    .escape()
    .isBoolean()
    .withMessage('ERR_NOT_BOOL')
    .toBoolean(true),
  query('canRequestDocumentEdit')
    .optional()
    .escape()
    .isBoolean()
    .withMessage('ERR_NOT_BOOL')
    .toBoolean(true),
  query('canEditDocument')
    .optional()
    .escape()
    .isBoolean()
    .withMessage('ERR_NOT_BOOL')
    .toBoolean(true),
  query('canVerify')
    .optional()
    .escape()
    .isBoolean()
    .withMessage('ERR_NOT_BOOL')
    .toBoolean(true),
  query('canReceivePoints')
    .optional()
    .escape()
    .isBoolean()
    .withMessage('ERR_NOT_BOOL')
    .toBoolean(true),
  query('canTransferToken')
    .optional()
    .escape()
    .isBoolean()
    .withMessage('ERR_NOT_BOOL')
    .toBoolean(true),
  query('canReceiveReferrals')
    .optional()
    .escape()
    .isBoolean()
    .withMessage('ERR_NOT_BOOL')
    .toBoolean(true),
  query('canParticipateEvent')
    .optional()
    .escape()
    .isBoolean()
    .withMessage('ERR_NOT_BOOL')
    .toBoolean(true),
];

export const validateCreateUserGroupRequest = [
  body('groupId')
    .notEmpty()
    .withMessage('ERR_REQUIRED')
    .bail()
    .escape()
    .isLength({ max: GROUP_ID_MAX_LENGTH })
    .withMessage('ERR_LENGTH_LONG')
    .custom(isValidGroupId),
  body('canCreateDocument')
    .notEmpty()
    .withMessage('ERR_REQUIRED')
    .bail()
    .escape()
    .isBoolean()
    .withMessage('ERR_NOT_BOOL')
    .toBoolean(true),
  body('canRequestDocumentEdit')
    .notEmpty()
    .withMessage('ERR_REQUIRED')
    .bail()
    .escape()
    .isBoolean()
    .withMessage('ERR_NOT_BOOL')
    .toBoolean(true),
  body('canEditDocument')
    .notEmpty()
    .withMessage('ERR_REQUIRED')
    .bail()
    .escape()
    .isBoolean()
    .withMessage('ERR_NOT_BOOL')
    .toBoolean(true),
  body('canVerify')
    .notEmpty()
    .withMessage('ERR_REQUIRED')
    .bail()
    .escape()
    .isBoolean()
    .withMessage('ERR_NOT_BOOL')
    .toBoolean(true),
  body('canReceivePoints')
    .notEmpty()
    .withMessage('ERR_REQUIRED')
    .bail()
    .escape()
    .isBoolean()
    .withMessage('ERR_NOT_BOOL')
    .toBoolean(true),
  body('canTransferToken')
    .notEmpty()
    .withMessage('ERR_REQUIRED')
    .bail()
    .escape()
    .isBoolean()
    .withMessage('ERR_NOT_BOOL')
    .toBoolean(true),
  body('canReceiveReferrals')
    .notEmpty()
    .withMessage('ERR_REQUIRED')
    .bail()
    .escape()
    .isBoolean()
    .withMessage('ERR_NOT_BOOL')
    .toBoolean(true),
  body('canParticipateEvent')
    .notEmpty()
    .withMessage('ERR_REQUIRED')
    .bail()
    .escape()
    .isBoolean()
    .withMessage('ERR_NOT_BOOL')
    .toBoolean(true),
];

export const validateDeleteUserGroupRequest = [
  body('groupId')
    .notEmpty()
    .withMessage('ERR_REQUIRED')
    .bail()
    .escape()
    .isLength({ max: GROUP_ID_MAX_LENGTH })
    .withMessage('ERR_LENGTH_LONG'),
];

export const userGroupDTOKeys = [
  'groupId',
  'canCreateDocument',
  'canReqeustDocumentEdit',
  'canEditDocument',
  'canVerify',
  'canReceivePoints',
  'canTransferToken',
  'canReceiveReferrals',
  'canParticipateEvent',
];

/**
 * Create one new user group
 * @param userGroupDTO Attributes of the new user group
 * @returns Newly created user group
 */
export const createUserGroup = async (
  userGroupDTO: UserGroupCreationAttributes
) => {
  const {
    groupId,
    canCreateDocument = false,
    canReqeustDocumentEdit = false,
    canEditDocument = false,
    canVerify = false,
    canReceivePoints = false,
    canTransferToken = false,
    canReceiveReferrals = false,
    canParticipateEvent = false,
  } = userGroupDTO;

  try {
    const result = await db.sequelize.transaction(async (transaction) => {
      const userGroup = await UserGroup.create(
        {
          groupId,
          canCreateDocument,
          canReqeustDocumentEdit,
          canEditDocument,
          canVerify,
          canReceivePoints,
          canTransferToken,
          canReceiveReferrals,
          canParticipateEvent,
        },
        { transaction }
      );

      return userGroup;
    });

    return result;
  } catch (error) {
    const err = error as ApiError;
    if (error instanceof UniqueConstraintError) {
      // Duplicate user group name (should be unique)
      err.status = 400;
      err.cause = 'ERR_DUPLICATE';
    }

    // Other errors
    if (!err.status) {
      err.status = 500;
      err.cause = 'ERR_DB';
    }

    throw error;
  }
};

/**
 * List user groups that match the search query
 * @param userGroupDTO Search query for user group
 * @returns List of user groups
 */
export const getUserGroups = async (
  userGroupDTO: Partial<UserGroupCreationAttributes> = {}
) => {
  try {
    const result = await db.sequelize.transaction(async (transaction) => {
      const userGroups = await UserGroup.findAll({
        where: userGroupDTO,
        transaction,
      });
      return userGroups;
    });
    return result;
  } catch (error) {
    const err = error as ApiError;
    if (!err.status) {
      err.status = 500;
      err.cause = 'ERR_DB';
    }
    throw error;
  }
};

/**
 * Updates one user group with given parameters
 * @param userGroupDTO Complete or partial user group attributes. Group ID is required.
 * @returns Number of affected rows
 */
export const updateUserGroup = async (
  userGroupDTO: Partial<UserGroupCreationAttributes>
) => {
  try {
    const result = await db.sequelize.transaction(async (transaction) => {
      const [affectedRows] = await UserGroup.update(
        { ...userGroupDTO },
        { where: { groupId: userGroupDTO.groupId }, transaction }
      );

      // No row affected: Send 404 Not Found
      if (affectedRows === 0) throw new NotFoundError();

      return affectedRows;
    });

    return result; // affected rows
  } catch (error) {
    const err = error as ApiError;
    if (!err.status) {
      err.status = 500;
      err.cause = 'ERR_DB';
    }
    throw error;
  }
};

/**
 * Delete one user group with the given ID.
 * @param groupId Id of the user group to delete
 * @returns Number of affected rows
 */
export const deleteUserGroup = async (groupId: GroupIdType) => {
  try {
    const result = await db.sequelize.transaction(async (transaction) => {
      const affectedRows = await UserGroup.destroy({
        where: { groupId },
        transaction,
      });

      // No row affected: Send 404 Not found
      if (affectedRows === 0) throw new NotFoundError();

      return affectedRows;
    });
    return result;
  } catch (error) {
    const err = error as ApiError;
    if (!err.status) {
      err.status = 500; // Internal server error
      err.cause = 'ERR_DB';
    }
    throw error;
  }
};
