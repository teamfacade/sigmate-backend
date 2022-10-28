import DatabaseEngine from '../database';
import WikiBlockEngine from './block';
import WikiDocumentEngine from './document';

export default class WikiEngine {
  dbEngine: DatabaseEngine;
  documentEngine: WikiDocumentEngine;
  blockEngine: WikiBlockEngine;

  constructor(databaseEngine: DatabaseEngine) {
    this.dbEngine = databaseEngine;
    this.documentEngine = new WikiDocumentEngine(this);
    this.blockEngine = new WikiBlockEngine(this);
  }

  // CRUD Document
  // Reward parameters
  // Search content
  // Verifications
}
