import { PaginationOptions } from '../../../middlewares/handlePagination';
import DocumentAudit, {
  DocumentAuditAttributes,
} from '../../../models/DocumentAudit';
import BadRequestError from '../../../utils/errors/BadRequestError';
import SequelizeError from '../../../utils/errors/SequelizeError';
import Document, { DocumentAttributes } from '../../../models/Document';
import { Op, WhereOptions } from 'sequelize';
import User from '../../../models/User';
import { userPublicAttributes } from '../../user';

export const getRecentDocumentAudits = async (
  pg: PaginationOptions | undefined,
  documentId: DocumentAttributes['id'] | undefined = undefined
) => {
  if (!pg) throw new BadRequestError();
  const where: WhereOptions<DocumentAuditAttributes> = {
    approvedAt: { [Op.not]: null },
  };
  if (documentId) {
    where.documentId = documentId;
  }
  try {
    return await DocumentAudit.findAndCountAll({
      where,
      attributes: ['id', 'approvedAt'],
      include: [
        {
          model: Document,
          attributes: ['id', 'title'],
        },
        {
          model: User,
          as: 'createdBy',
          attributes: userPublicAttributes,
        },
      ],
      order: [['approvedAt', 'DESC']],
      limit: pg.limit,
      offset: pg.offset,
    });
  } catch (error) {
    throw new SequelizeError(error as Error);
  }
};
