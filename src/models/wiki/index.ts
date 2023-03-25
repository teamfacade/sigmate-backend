/** Partition key type of SigmateWiki table */
export type SigmateWikiPK = string;
/** Sort key type of SigmateWiki table */
export type SigmateWikiSK = string;

export interface SigmateWikiSchema extends Record<string, unknown> {
  WikiPK: SigmateWikiPK;
  WikiSK: SigmateWikiSK;

  // Global secondary indexes
  WikiGSIPK?: string;
  WikiGSISK?: string;

  /** DynamoDB Time to Live: UNIX Epoch in seconds */
  ExpiresAt?: number;
}

export type SigmateWikiGSISchema = Required<
  Pick<SigmateWikiSchema, 'WikiGSIPK' | 'WikiGSISK'>
> &
  Partial<Omit<SigmateWikiSchema, 'WikiGSIPK' | 'WikiGSISK'>>;
