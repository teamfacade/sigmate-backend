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
    let documents: Document[] = [];
    let count = 0;

    const startsWith = await Document.findAndCountAll({
      where: {
        title: { [Op.startsWith]: q.title },
      },
      limit: pg.limit,
      offset: pg.offset,
    });

    documents = startsWith.rows;
    count = startsWith.count;

    if (count < 0) {
      const contains = await Document.findAndCountAll({
        where: {
          title: { [Op.substring]: q.title },
        },
        limit: pg.limit,
        offset: pg.offset,
      });

      documents = contains.rows;
      count = contains.count;
    }

    return { documents, count };
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};
