import { Op } from 'sequelize';
import { DateTime } from 'luxon';
import MissionModel from '../../models/Mission.model';
import { MissionAttribs } from '../../models/Mission.model';
import Action from '../Action';
import User from '../auth/User';
import UserModel from '../../models/User.model';
import ModelService from '../ModelService';
import Midas from './Midas';
import UserGroup from '../../models/UserGroup.model';
import ActionModel from '../../models/Action.model';
import Auth from '../auth';
import { MissionError } from '../errors/MissionError';
import Logger from '../logger';
import ServerError from '../errors/ServerError';

type MissionOptions = {
  model?: MissionModel | MissionModel[];
  user?: User;
  action?: Action;
};

type MissionFindOptions = {
  action?: Action;
};

export default class Mission extends ModelService<MissionAttribs> {
  model?: MissionModel | MissionModel[];
  user?: User;
  action?: Action;

  name = 'MISSION';
  logger?: Logger;
  get serviceStatus() {
    return Mission.status;
  }
  constructor(options: MissionOptions = {}) {
    super();
    const { model, user, action } = options;
    this.model = model;
    this.action = action;
    this.user = user || action?.subject;
    this.logger = Mission.logger;
  }

  public static async findProgressable(
    options: MissionFindOptions,
    parent?: Action
  ): Promise<MissionModel[]> {
    const { action } = options;
    const userModel = action?.subject?.model;
    if (!userModel) return [];
    await Midas.tick();
    if (action) {
      const find = Action.create({
        type: Action.TYPE.DATABASE,
        name: 'MISSION_FIND_BY_ACTION',
        transaction: true,
        parent,
      });
      const now = DateTime.now().setZone('utc');
      return await find(async ({ transaction }) => {
        return await MissionModel.findAll({
          where: {
            requiredUserTierMin: { [Op.lte]: userModel.tier },
            requiredUserTierMax: { [Op.gte]: userModel.tier },
            closedAt: { [Op.is]: null },
            [Op.or]: [
              { closesAt: { [Op.is]: null } },
              { closesAt: { [Op.gt]: now.toJSDate() } },
            ],
          },
          include: [
            {
              model: UserGroup,
              as: 'requiredGroups',
              attributes: ['id'],
              where: {
                id: userModel.getDataValue('groupId'),
              },
              required: true, // INNER JOIN
            },
            {
              model: UserModel.scope('exists'),
              as: 'users',
              where: {
                id: userModel.id,
              },
              through: {
                // UserMission
                where: {
                  canProgress: true,
                  [Op.or]: [
                    { endedAt: { [Op.is]: null } },
                    { repeatCount: { [Op.not]: null } },
                  ],
                },
              },
            },
            {
              model: ActionModel,
              attributes: ['id', 'name'],
              where: {
                name: action.name,
              },
            },
          ],
          transaction,
        });
      });
    } else {
      return [];
    }
  }

  public async findProgressable(
    options: MissionFindOptions = {},
    parent?: Action
  ) {
    const action = options.action || this.action;
    if (!action) {
      throw new MissionError({
        code: 'MISSION/IV_FIND_DTO',
        message: 'Action not provided',
      });
    }
    if (action?.subject?.model) this.user = action.subject;
    this.model = await Mission.findProgressable(options, parent);
  }

  public async progress(
    options: {
      action?: Action;
    } = {},
    parent?: Action
  ) {
    const action = options.action || this.action;
    if (!action) {
      throw new MissionError({
        code: 'MISSION/IV_FIND_DTO',
        message: 'Action not provided',
      });
    }

    const bulkProgressMissions = Action.create({
      name: 'MISSION_PROGRESS_BULK',
      auth: [Auth.can('rewards__progressMission')],
      transaction: true,
      parent,
    });

    await bulkProgressMissions(async ({ action: bulkProgressMissions }) => {
      // Look for missions
      await this.findProgressable({ action }, bulkProgressMissions);
      if (!this.found || !this.model) return;

      // Progress them
      const missions = this.model instanceof Array ? this.model : [this.model];
      const now = DateTime.now().setZone('utc');
      for (const i in missions) {
        try {
          const progressMission = Action.create({
            name: 'MISSION_PROGRESS',
            parent: bulkProgressMissions,
          });

          await progressMission(async ({ action: progressMission }) => {
            const mission = missions[i];
            const userMission = mission.UserMission;
            if (!userMission) {
              throw new MissionError({ code: 'MISSION/NA_USER_MISSION' });
            }

            let oldScore = userMission.score;
            // Reset repeatable actions
            if (mission.isRepeatable) {
              if (userMission.endedAt instanceof Date) {
                const endedAt = DateTime.fromJSDate(userMission.endedAt);
                const repeatInterval = mission.repeatInterval as NonNullable<
                  typeof mission.repeatInterval
                >;
                const repeatIntervalUnits =
                  mission.repeatIntervalUnits as NonNullable<
                    typeof mission.repeatIntervalUnits
                  >;
                const repeatableFrom = endedAt
                  .plus({ [repeatIntervalUnits]: repeatInterval })
                  .startOf(repeatIntervalUnits);
                if (now < repeatableFrom) {
                  // Cannot repeat yet
                  throw new MissionError({
                    code: 'MISSION/RJ_PROGRESS_BEFORE_REPEATABLE',
                  });
                } else {
                  // Can repeat. Start over from score 0
                  userMission.set('endedAt', null);
                  userMission.set('accomplished', null);
                  oldScore = 0;
                }
              }
            }

            // Action metric above threshold?
            if (mission.metricThreshold !== undefined) {
              if (action.metric !== undefined) {
                if (action.metric < mission.metricThreshold) {
                  throw new MissionError({
                    code: 'MISSION/RJ_PROGRESS_METRIC_THRESHOLD',
                  });
                }
              } else {
                // If action metric threshold is set for the mission,
                // the action must calculate a metric for its results
                throw new MissionError({ code: 'MISSION/NA_METRIC' });
              }
            }

            let scoreDiff = 0;
            if (mission.scoreIncrement !== undefined) {
              scoreDiff += mission.scoreIncrement;
            }
            if (mission.scoreWeight !== undefined) {
              if (action.metric !== undefined) {
                scoreDiff += mission.scoreWeight * action.metric;
              } else {
                // If score weight is set for the mission,
                // the action must calculate a metric for its results
                throw new MissionError({ code: 'MISSION/NA_METRIC' });
              }
            }

            let newScore = oldScore + scoreDiff;
            if (mission.scoreLimit !== undefined) {
              if (newScore > mission.scoreLimit) {
                newScore = mission.scoreLimit;
              }
            }
            userMission.set('score', newScore);

            // Check if it is accomplished
            if (userMission.score >= mission.scoreObjective) {
              userMission.set('accomplished', true);
              if (mission.endOnObjective) {
                // No longer progressable
                userMission.set('endedAt', now.toJSDate());
              }
              if (typeof userMission.accomplishedCount === 'number') {
                // Keep track of how many times user accomplished this mission
                userMission.set(
                  'accomplishedCount',
                  userMission.accomplishedCount + 1
                );
              }
              if (mission.endOnObjective) {
                // TODO
              }
            }

            const progressSave = Action.create({
              type: Action.TYPE.DATABASE,
              name: 'MISSION_PROGRESS_SAVE',
              parent: progressMission,
            });
            await progressSave(({ transaction }) =>
              userMission.save({ transaction })
            );
          });
        } catch (error) {
          if (error instanceof ServerError) {
            Mission.logger?.log({ error });
          } else {
            throw error;
          }
        }
      } // for (const i in missions) {
    });
  }

  // public static async accomplish(
  //   options: { mission: MissionModel },
  //   parent?: Action
  // ) {
  //   return; // TODO
  // }

  public static async endClosed(
    options: { mission: MissionModel },
    parent?: Action
  ) {
    const endClosed = Action.create({
      name: 'MISSION_END_CLOSED',
      parent,
    });

    await endClosed(async ({ action }) => {
      const { mission } = options;
      const userMission = mission.UserMission;
      if (!userMission) {
        throw new MissionError({ code: 'MISSION/NA_USER_MISSION' });
      }
      if (!userMission.endedAt) {
        const endedAt = mission.closedAt || mission.closesAt;
        if (!endedAt) {
          throw new MissionError({ code: 'MISSION/CF_END_NOT_CLOSED' });
        }
        userMission.set('endedAt', endedAt);
      }
      if (
        userMission.accomplished === undefined ||
        userMission.accomplished === null
      ) {
        userMission.set('accomplished', false);
      }
      const endClosedSave = Action.create({
        type: Action.TYPE.DATABASE,
        name: 'MISSION_END_CLOSED_SAVE',
        parent: action,
      });
      await endClosedSave(({ transaction }) =>
        userMission.save({ transaction })
      );
    });
  }
}
