import { NextFunction, Request, Response } from 'express';
import { createPgRes } from '../../middlewares/handlePagination';
import Document, { DocumentResponseConcise } from '../../models/Document';
import BadRequestError from '../../utils/errors/BadRequestError';
import { searchWikiDocument } from '../database/wiki/search';

type GetWikiSearchQuery = {
  q?: string;
  title?: string;
  textContent?: string;
};

export const searchWikiDocumentController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { q } = req.query as GetWikiSearchQuery;
    const pg = req.pg;
    if (!pg) throw new BadRequestError();

    let documents: Document[] = [];
    let count = 0;

    // Search by title
    const searchRes = await searchWikiDocument({ title: q, pg });
    documents = searchRes.documents;
    count = searchRes.count;

    // Prepare response
    const documentResponses = await Promise.all(
      documents.map((d) => d.toResponseJSONConcise())
    );
    const response = createPgRes<DocumentResponseConcise>({
      limit: pg.limit,
      offset: pg.offset,
      count,
      data: documentResponses,
    });

    // Send response
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
