import { Op } from 'sequelize';
import { PaginationOptions } from '../../../middlewares/handlePagination';
import Document from '../../../models/Document';
import SequelizeError from '../../../utils/errors/SequelizeError';

type WikiDocumentSearchQuery = {
  title?: string;
  textContent?: string;
  pg: PaginationOptions;
};

export const searchWikiDocument = async (q: WikiDocumentSearchQuery) => {
  const { pg } = q;
  try {
    const { rows: documents, count } = await Document.findAndCountAll({
      where: {
        title: { [Op.substring]: q.title },
      },
      limit: pg.limit,
      offset: pg.offset,
    });

    return { documents, count };
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};
