import { QueryTypes } from 'sequelize/types';
import { cleanWs } from '../../utils';
import Action from '../Action';
import Database from '../Database';
import Service from '../Service';
import Mission from './Mission';

type ReportDTO = {
  action: Action;
};

/**
 * MIDAS: Sigmate user reward/penalty engine
 */
export default class Midas extends Service {
  public static start() {
    Midas.status = Midas.STATE.STARTED;
  }

  public static async report(dto: ReportDTO) {
    const { action } = dto;
    // Check if action is authenticated
    if (!action.subject?.found) return;

    // Check if action succeeded
    if (action.status === Action.STATE.FINISHED) {
      // On action success, look for UserMission
    } else if (action.status === Action.STATE.FAILED) {
      // On action success, look for UserPenalty
    }
  }

  static tickPromise?: Promise<void>;
  private static async __tick(parent?: Action) {
    const closeMissions = Action.create({
      type: Action.TYPE.DATABASE,
      name: 'MIDAS_MISSION_CLOSE',
      transaction: false,
      parent,
    });

    // If the mission already closed but user has not succeeded yet,
    // fail the mission
    await closeMissions(async () => {
      const sql = cleanWs(`
        START TRANSACTION;

        UPDATE \`user_missions\`
          INNER JOIN
            \`missions\` ON 
              \`user_missions\`.\`mission_id\` = \`missions\`.\`id\` AND
              \`missions\`.\`closed_at\` IS NOT NULL
          SET
            \`user_missions\`.\`ended_at\` = \`missions\`.\`closed_at\`,
            \`user_missions\`.\`accomplished\` = 0
          WHERE
            \`user_missions\`.\`ended_at\` IS NULL AND
            \`user_missions\`.\`accomplished\` IS NULL;

        UPDATE \`user_missions\`
          INNER JOIN
            \`missions\` ON
              \`user_missions\`.\`mission_id\` = \`missions\`.\`id\` AND
              \`missions\`.\`closed_at\` IS NULL AND
              \`missions\`.\`closes_at\` <= NOW()
          SET
            \`user_missions\`.\`ended_at\` = \`missions\`.\`closed_at\`,
            \`user_missions\`.\`accomplished\` = 0
          WHERE
            \`user_missions\`.\`ended_at\` IS NULL AND
            \`user_missions\`.\`accomplished\` IS NULL;

        COMMIT;
      `);
      await Database.sequelize.query(sql, {
        raw: true,
        type: QueryTypes.BULKUPDATE,
      });
    });
  }

  public static async tick(parent?: Action) {
    if (!Midas.tickPromise) Midas.tickPromise = Midas.__tick(parent);
    await Midas.tickPromise;
  }

  public static async handleActionFinish(options: { action: Action }) {
    const { action } = options;

    // Look for progressable missions
    const mission = new Mission({ action });
    await mission.findProgressable();
    if (!mission.found) return;

    // Progress them
  }

  name = 'MIDAS';
  get serviceStatus() {
    return Midas.status;
  }
}
