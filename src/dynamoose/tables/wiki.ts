import { Table } from 'dynamoose';
import DocumentVersion from '../models/wiki/DocumentVersion';
import BlockVersion from '../models/wiki/BlockVersion';

const WikiTable = new Table('SigmateWiki', [DocumentVersion, BlockVersion], {
  create: false,
  update: false,
  waitForActive: false,
  initialize: false,
});

export default WikiTable;
