import { Table } from 'dynamoose';

export interface WikiAttribs {
  /** Partition Key (hash key) */
  WikiPK: string;
  /** Sort key (range key) */
  WikiSK: string;

  /** GSI Partition Key (hash key) */
  WikiGSIPK?: string;
  /** GSI Sort key (range key) */
  WikiGSISK?: string;
}

const WikiTable = new Table('SigmateWiki', [], {
  create: false,
  update: false,
  waitForActive: false,
  initialize: false,
  expires: {
    attribute: 'ExpiresIn',
  },
});

export default WikiTable;
