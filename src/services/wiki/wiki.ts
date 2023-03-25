import Service from '..';

// type DocumentType = 'Collection#' | 'Nft#';

// type CreateDocumentDTO = {
//   type: string;
//   title: string;
//   keyInfo: Record<string, KeyInfoDTO>;
//   createdBy: User;
// };

// type KeyInfoDTO = {
//   /** Leave `undefined` to use default value */
//   name?: string;
//   /** Leave `undefined` to use default value */
//   content?: string;
// };

export default class WikiService extends Service {
  constructor() {
    super('Wiki');
  }

  // public createDocument(args: CreateDocumentDTO) {
  //   const { type, title, keyInfo, createdBy } = args;

  //   // Create document ID
  //   const userId: string = createdBy.id;
  //   const documentId = Droplet.generate();
  //   const documentVersionId = Droplet.generate();

  //   // Create blocks

  //   // Create Document Version Item (Dynamo)
  //   const documentVersion: WikiDocumentSchema = {
  //     WikiPK: `Document#${documentId}`,
  //     WikiSK: `Document#v_${documentVersionId}`,
  //     Type: {
  //       data: type,
  //       action: 'create',
  //     },
  //     Title: {
  //       data: title,
  //       action: 'create',
  //     },
  //     KeyInfo: [],
  //     Content: [],
  //     AuditedBy: userId,
  //   };

  //   // Create Latest Document Version Item (Dynamo)

  //   // Create SQL entry (link collections)

  //   // Build document

  //   // Send CreateDocument event to rewards engine

  //   // Return result
  // }
}
