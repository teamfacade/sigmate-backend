import { Schema, type } from 'dynamoose';
import { SchemaDefinition } from 'dynamoose/dist/Schema';
import { validateAuditAction } from '.';

const TITLE_SIZE_MIN = 3;
const TITLE_SIZE_MAX = 128;
const AUDIT_COMMENT_SIZE = 255;

const BLOCK_STRUCTURE: SchemaDefinition[] = [
  {
    id: {
      type: String,
      required: true,
    },
    version: {
      type: String,
      required: true,
    },
    action: {
      type: [String, type.NULL],
      required: true,
    },
  },
];

const DocumentVersionSchema = new Schema(
  {
    WikiPK: {
      type: String,
      hashKey: true,
    },
    WikiSK: {
      type: String,
      rangeKey: true,
    },
    Type: {
      type: String,
      enum: ['collection#', 'nft#', 'team#', 'person#', 'term#'],
      required: true,
    },
    Title: {
      type: String,
      validate: (v) =>
        typeof v === 'string' &&
        v.length > TITLE_SIZE_MIN &&
        v.length < TITLE_SIZE_MAX,
      required: true,
    },
    KeyInfo: {
      type: Array,
      schema: BLOCK_STRUCTURE,
      required: true,
    },
    Content: {
      type: Array,
      schema: BLOCK_STRUCTURE,
      required: true,
    },
    Tags: {
      type: Array,
      schema: [String],
      required: true,
    },
    DocumentVersion: {
      type: String,
      required: false,
    },
    DocumentAction: {
      type: [String, type.NULL],
      validate: validateAuditAction,
      required: true,
    },
    AttribActions: {
      type: Object,
      schema: {
        Type: {
          type: [String, type.NULL],
          validate: validateAuditAction,
          required: true,
        },
        Title: {
          type: [String, type.NULL],
          validate: validateAuditAction,
          required: true,
        },
        KeyInfo: {
          type: [String, type.NULL],
          validate: validateAuditAction,
          required: true,
        },
        Content: {
          type: [String, type.NULL],
          validate: validateAuditAction,
          required: true,
        },
      },
      required: true,
    },
    AuditedBy: {
      type: String,
      required: true,
    },
    AuditComment: {
      type: String,
      validate: (v) => typeof v === 'string' && v.length < AUDIT_COMMENT_SIZE,
      required: true,
    },
  },
  { saveUnknown: false }
);

export default DocumentVersionSchema;
