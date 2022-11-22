import { QueryTypes } from 'sequelize';
import { PaginationOptions } from '../../middlewares/handlePagination';
import db from '../../models';
import User from '../../models/User';
import SequelizeError from '../../utils/errors/SequelizeError';
import { buildLeaderboardModels } from '../leaderboard';

export type LeaderboardQueryRow = {
  total: string;
  subtotal: string;
  grantedToId: number;
  policyId: number;
  policyName: string;
};

const leaderboardSql = `
  WITH \`totals\` AS
  (
    SELECT SUM(\`points\`) AS \`total\`, 
      \`granted_to_id\` AS \`grantedToId\`
    FROM \`user_points\`
    WHERE \`user_points\`.\`deleted_at\` IS NULL
    GROUP BY \`granted_to_id\`
    ORDER BY \`total\` DESC
    LIMIT :limit
    OFFSET :offset
  ),
  \`subtotals\` AS
  (
    SELECT SUM(\`points\`) AS \`subtotal\`, 
      \`granted_to_id\` AS \`grantedToId\`, 
      \`policy_id\` AS \`policyId\`
    FROM \`user_points\`
    WHERE \`granted_to_id\` IN ( SELECT \`grantedToId\` FROM \`totals\` )
    GROUP BY \`grantedToId\`, \`policyId\`
  )
  
  SELECT \`totals\`.\`total\`, 
    \`subtotals\`.* , 
    \`user_point_policies\`.\`name\` AS \`policyName\`
  FROM \`subtotals\` 
  INNER JOIN \`totals\` 
    ON \`totals\`.\`grantedToId\`=\`subtotals\`.\`grantedToId\`
  INNER JOIN \`user_point_policies\` 
    ON \`subtotals\`.\`policyId\` = \`user_point_policies\`.\`id\`
  ORDER BY \`total\` DESC, \`grantedToId\`, \`policyId\`;
`.replace(/\s{2,}/g, ' ');

const myRankSql = `
  WITH \`my_total\` AS
  (
    SELECT SUM(\`points\`) AS \`total\`
    FROM \`user_points\`
    WHERE \`granted_to_id\` = :userId
    GROUP BY \`granted_to_id\`
  ),
  \`higher_than_me\` AS
  (
    SELECT \`granted_to_id\`
    FROM \`user_points\`
    WHERE \`deleted_at\` IS NULL
    GROUP BY \`granted_to_id\`
    HAVING SUM(\`points\`) > (SELECT \`total\` FROM \`my_total\`)
  )
  SELECT COUNT(\`granted_to_id\`) + 1 AS \`rank\` FROM \`higher_than_me\`
`.replace(/\s{2,}/g, ' ');

const myLbSql = `
  SELECT SUM(\`points\`) AS \`subtotal\`, 
    \`granted_to_id\` AS \`grantedToId\`, 
    \`policy_id\` AS \`policyId\`, 
    \`user_point_policies\`.\`name\` AS \`policyName\`
  FROM \`user_points\`
  INNER JOIN \`user_point_policies\` 
    ON \`user_point_policies\`.\`id\` = \`user_points\`.\`policy_id\`
  WHERE \`granted_to_id\` = :userId
  GROUP BY \`grantedToId\`, \`policyId\`
  ORDER BY \`policyId\`;
`.replace(/\s{2,}/g, ' ');

export const getLeaderboard = async (pg: PaginationOptions) => {
  const { limit, offset } = pg;
  try {
    const lbQueryResult = await db.sequelize.query(leaderboardSql, {
      replacements: { limit, offset },
      type: QueryTypes.SELECT,
    });

    const leaderboard = await buildLeaderboardModels(lbQueryResult);
    return leaderboard;
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};

export const getMyLeaderboard = async (user: User) => {
  let rank = -1;
  try {
    const myRankQueryResult = await db.sequelize.query(myRankSql, {
      replacements: { userId: user.id },
      type: QueryTypes.SELECT,
    });

    if (myRankQueryResult.length) {
      const myRankQueryRow = myRankQueryResult[0] as { rank: number };
      rank = myRankQueryRow.rank;
    }

    const myLbQueryResult = await db.sequelize.query(myLbSql, {
      replacements: { userId: user.id },
      type: QueryTypes.SELECT,
    });

    const myLeaderboard = await buildLeaderboardModels(myLbQueryResult, {
      skipUser: true,
    });

    if (myLeaderboard.length) {
      myLeaderboard[0].rank = rank;
    }

    return myLeaderboard;
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};
