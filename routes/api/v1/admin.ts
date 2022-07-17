import express, { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import _ from 'lodash';
import {
  createUserGroup,
  getUserGroups,
  validateGetUserGroupRequest,
  validateCreateUserGroupRequest,
  validateDeleteUserGroupRequest,
  deleteUserGroup,
  userGroupDTOKeys,
  validateUpdateUserGroupRequest,
  updateUserGroup,
} from '../../../services/admin/userGroup';
import UserGroup, {
  UserGroupCreationAttributes,
} from '../../../models/user/UserGroup';
import InvalidRequestError from '../../../utilities/errors/InvalidRequestError';
import NotFoundError from '../../../utilities/errors/NotFoundError';
import { ApiResponse } from '..';

const adminRouter = express.Router();

interface UserGroupResponse extends ApiResponse {
  userGroup?: UserGroup;
  userGroups?: UserGroup[];
}

adminRouter
  .route('/usergroup')
  .get(
    validateGetUserGroupRequest,
    async (req: Request, res: Response, next: NextFunction) => {
      // Handle invalid requests
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return next(new InvalidRequestError(errors.array()));

      // Only pick recognized attributes
      const userGroupDTO: Partial<UserGroupCreationAttributes> = _.pick(
        req.query,
        userGroupDTOKeys
      ) as Partial<UserGroupCreationAttributes>;

      // List existing user groups
      try {
        // Get all user groups by critera
        const userGroups = await getUserGroups(userGroupDTO);
        // Send them all to the client
        const response: UserGroupResponse = {
          success: true,
          userGroups,
        };
        res.status(200).json(response);
      } catch (err) {
        // Unexpected database error
        next(err);
      }
    }
  )
  .post(
    // Create new user group
    validateCreateUserGroupRequest,
    async (req: Request, res: Response, next: NextFunction) => {
      // Handle invalid requests
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return next(new InvalidRequestError(errors.array()));

      // Sanitize: only pick recognized attributes
      const userGroupDTO: UserGroupCreationAttributes = _.pick(
        req.body,
        userGroupDTOKeys
      ) as UserGroupCreationAttributes;

      try {
        // Attempt to create user group
        const newUserGroup = await createUserGroup(userGroupDTO);
        // If created, send the created group back to client
        const response: UserGroupResponse = {
          success: true,
          userGroup: newUserGroup,
        };
        res.status(201).json(response);
      } catch (err) {
        // Unexpected database error
        next(err);
      }
    }
  )
  .patch(
    validateUpdateUserGroupRequest,
    async (req: Request, res: Response, next: NextFunction) => {
      // Handle invalid requests
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return next(new InvalidRequestError(errors.array()));

      // Sanitize: only pick recognized attributes
      const userGroupDTO: Partial<UserGroupCreationAttributes> = _.pick(
        req.body,
        userGroupDTOKeys
      );

      try {
        const affectedRows = await updateUserGroup(userGroupDTO);

        if (affectedRows === 0) throw new NotFoundError();

        res.status(204).send();
      } catch (err) {
        // Unexpected database error
        next(err);
      }
    }
  )
  .delete(
    validateDeleteUserGroupRequest,
    async (req: Request, res: Response, next: NextFunction) => {
      // Handle invalid requests
      const errors = validationResult(req);
      if (!errors.isEmpty())
        return next(new InvalidRequestError(errors.array()));

      const { groupId } = req.body;
      try {
        // Attempt to delete user group
        const affectedRows = await deleteUserGroup(groupId);

        // If none found, that user group does not exist
        if (affectedRows === 0) throw new NotFoundError();

        // If we reached here, we succeeded
        res.status(204).send();
      } catch (err) {
        // Unexpected database error
        next(err);
      }
    }
  );

export default adminRouter;
