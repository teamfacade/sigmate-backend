type DocumentId = sigmate.Wiki.DocumentId;
type DocumentVersionId = sigmate.Wiki.DocumentVersionId;
type BlockId = sigmate.Wiki.BlockId;
type BlockVersionId = sigmate.Wiki.BlockVersionId;

export class WikiKey {
  static GSI_NAME = 'WikiGSI-index';
  static PK_NAME = 'WikiPK';
  static SK_NAME = 'WikiSK';
  static GSI_PK_NAME = 'WikiGSIPK';
  static GSI_SK_NAME = 'WikiGSISK';

  static getDocumentPK(id: DocumentId) {
    return `Document::${id}`;
  }

  static getDocumentSK(version: sigmate.Wiki.DocumentVersionId) {
    return `Document::v_${version}`;
  }

  static getBlockSK(blockId: BlockId, documentVersion: DocumentVersionId) {
    return `Block::v_${documentVersion}::${blockId}`;
  }

  static getBlockGSIPK(documentId: DocumentId) {
    return `BlockHistory::${documentId}`;
  }

  static getBlockGSISK(id: BlockId, version: BlockVersionId) {
    return `Block::${id}::v_${version}`;
  }
}

export const DOCUMENT_TYPES: sigmate.Wiki.DocumentType[] = [
  'collection#',
  'nft#',
  'team#',
  'person#',
  'term#',
];

export const DIFF_RESULTS: sigmate.Wiki.DiffResultRaw[] = [
  'C-',
  'U-',
  'UT',
  '-T',
  'D-',
  '--',
];

export const DIFF_ACTIONS: sigmate.Wiki.DiffAction[] = ['C', 'U', 'D', '-'];
