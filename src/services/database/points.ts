import { Op, Transaction } from 'sequelize';
import { DateTime } from 'luxon';
import User from '../../models/User';
import UserPoint from '../../models/UserPoint';
import UserPointPolicy, { PolicyNames } from '../../models/UserPointPolicy';
import ApiError from '../../utils/errors/ApiError';
import SequelizeError from '../../utils/errors/SequelizeError';
import UnauthenticatedError from '../../utils/errors/UnauthenticatedError';
import db from '../../models';

export const createDefaultPolicy = async () => {
  return await db.sequelize.transaction(async (transaction) => {
    await UserPointPolicy.findOrCreate({
      where: { name: 'forumPostCreate' },
      defaults: {
        name: 'forumPostCreate',
        ppa: 30,
        maxActionsPerDay: 5,
      },
      transaction,
    });
    await UserPointPolicy.findOrCreate({
      where: { name: 'forumPostCommentCreate' },
      defaults: {
        name: 'forumPostCommentCreate',
        ppa: 10,
        maxActionsPerDay: 10,
      },
      transaction,
    });
    await UserPointPolicy.findOrCreate({
      where: { name: 'referral' },
      defaults: {
        name: 'referral',
        ppa: 300,
        maxActionsPerDay: 30,
      },
      transaction,
    });
    await UserPointPolicy.findOrCreate({
      where: { name: 'wikiDocumentEdit' },
      defaults: {
        name: 'wikiDocumentEdit',
        ppa: 75,
        maxActionsPerDay: 10,
        maxActionsPerTarget: 2,
      },
    });
  });
};

export const grantPoints = async (options: {
  grantedTo: User | null | undefined;
  policy: PolicyNames;
  targetPk?: number;
  transaction?: Transaction;
}) => {
  const { grantedTo, policy: policyName, targetPk, transaction } = options;
  if (!grantedTo) throw new UnauthenticatedError();
  const now = DateTime.now().setZone('utc');
  try {
    // Look for policy
    let policy = await UserPointPolicy.findOne({
      where: { name: policyName },
      transaction,
    });

    // Create default policy if not done so already
    if (!policy) {
      switch (policyName) {
        case 'forumPostCreate':
        case 'forumPostCommentCreate':
        case 'referral':
        case 'wikiDocumentEdit':
          await createDefaultPolicy();
          break;
      }
      // ...and try again
      policy = await UserPointPolicy.findOne({
        where: { name: policyName },
        transaction,
      });
    }

    // If policy still doesn't exist, something's wrong
    if (!policy)
      throw new ApiError(`ERR_POINTS_UNEXPECTED_POLICY: ${policyName}`);

    // Check policy
    if (policy.maxActionsPerDay) {
      const actionCountToday = await UserPoint.count({
        where: {
          grantedToId: grantedTo.id,
          policyId: policy.id,
          createdAt: {
            [Op.between]: [
              now.startOf('day').toJSDate(),
              now.endOf('day').toJSDate(),
            ],
          },
        },
        transaction,
      });
      if (actionCountToday >= policy.maxActionsPerDay) {
        // Exceeds maxiumum action per day limit policy. Do not give points
        return null;
      }
    }
    if (policy.maxActionsPerTarget && targetPk) {
      const actionCountTarget = await UserPoint.count({
        where: {
          grantedToId: grantedTo.id,
          policyId: policy.id,
          createdAt: {
            [Op.between]: [
              now.startOf('day').toJSDate(),
              now.endOf('day').toJSDate(),
            ],
          },
          targetPk,
        },
        transaction,
      });
      if (actionCountTarget >= policy.maxActionsPerTarget) {
        // Exceeds maximum action per target (per day) limit policy.
        // Do not grant points
        return null;
      }
    }

    // Grant points
    const point = await UserPoint.create(
      {
        points: policy.ppa,
        policyId: policy.id,
        targetPk,
        grantedToId: grantedTo.id,
      },
      { transaction }
    );

    return point;
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};
