import { Request, Response, NextFunction } from 'express';
import {
  createPgRes,
  PaginationOptions,
} from '../../middlewares/handlePagination';
import Document from '../../models/Document';
import { DocumentAuditResponse } from '../../models/DocumentAudit';
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
        const createdBy = audit.createdBy;
        return {
          id: auditJSON.id,
          document: {
            id: document.id,
            title: document.title,
          },
          createdBy: createdBy ? await userPublicInfoToJSON(createdBy) : null,
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
