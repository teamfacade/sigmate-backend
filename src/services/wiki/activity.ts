import { Request, Response, NextFunction } from 'express';
import {
  createPgRes,
  PaginationOptions,
} from '../../middlewares/handlePagination';
import Document from '../../models/Document';
import { DocumentAuditResponse } from '../../models/DocumentAudit';
import User from '../../models/User';
import { getRecentDocumentAudits } from '../database/wiki/activity';
import { userPublicInfoToJSON } from '../user';

export const getRecentEditsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const pg = req.pg as PaginationOptions;
    const documentId = req.query.document as unknown as number | undefined;
    const { rows: audits, count } = await getRecentDocumentAudits(
      pg,
      documentId
    );
    const auditsRes: DocumentAuditResponse[] = await Promise.all(
      audits.map(async (audit) => {
        const auditJSON = audit.toJSON();
        const document = audit.document as Document;
        const createdBy = audit.createdBy as User;
        return {
          id: auditJSON.id,
          document: {
            id: document.id,
            title: document.title,
          },
          createdBy: await userPublicInfoToJSON(createdBy),
          approvedAt: auditJSON.approvedAt || null,
        };
      })
    );
    const pgRes = createPgRes({
      limit: pg.limit,
      offset: pg.offset,
      count,
      data: auditsRes,
    });
    res.status(200).json(pgRes);
  } catch (error) {
    next(error);
  }
};

// export const getRecentAuditsByDocumentController = async (
//   req: Request,
//   res: Response,
//   next: NextFunction,
// ) => {
//   try {

//   } catch (error) {
//     next(error);
//   }
// }
