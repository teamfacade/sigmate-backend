import { Schema, type } from 'dynamoose';
import { DateTime } from 'luxon';
import { validateAuditAction, validateStructureAuditAction, WikiKey } from '.';
import { WikiBlock } from '../../../services/wiki/block';

const BlockVersionSchema = new Schema(
  {
    WikiPK: {
      type: String,
      hashKey: true,
    },
    WikiSK: {
      type: String,
      rangeKey: true,
    },
    WikiGSIPK: {
      type: String,
      index: {
        name: WikiKey.GSI_NAME,
        type: 'global',
        rangeKey: WikiKey.GSI_SK_NAME,
      },
    },
    WikiGSISK: {
      type: String,
    },
    BlockVersion: {
      type: String,
      required: false,
    },
    DocumentVersion: {
      type: String,
      required: true,
    },
    Type: {
      type: String,
      enum: WikiBlock.SUPPORTED_TYPES,
      required: true,
    },
    Data: {
      type: [Object, type.NULL],
      schema: [
        // Header
        {
          type: Object,
          schema: {
            text: String,
            level: String,
          },
        },
        // Paragraph
        {
          type: Object,
          schema: {
            text: String,
          },
        },
        // List
        {
          type: Object,
          schema: {
            style: String,
            items: {
              type: Array,
              schema: [String],
            },
          },
        },
        // Nested List
        {
          type: Object,
          schema: {
            style: String,
            items: {
              type: Array,
              schema: [
                {
                  content: String,
                  items: type.THIS,
                },
              ],
            },
          },
        },
        // Table
        {
          type: Object,
          schema: {
            withHeadings: Boolean,
            content: {
              type: Array,
              schema: [
                {
                  type: Array,
                  schema: [String],
                },
              ],
            },
          },
        },
        // Image
        {
          type: Object,
          schema: {
            file: {
              type: Object,
              schema: {
                url: {
                  type: String,
                  required: true,
                },
              },
            },
            caption: String,
            withBorder: Boolean,
            withBackground: Boolean,
            stretched: Boolean,
          },
        },
        // Warning
        {
          type: Object,
          schema: {
            title: String,
            message: String,
          },
        },
      ],
    },
    Ext: {
      type: Object,
      validate: (value) => {
        if (
          value &&
          typeof value === 'object' &&
          !(value instanceof Date) &&
          !(value instanceof Buffer) &&
          !(value instanceof Array)
        ) {
          try {
            Object.keys(value).forEach((k) => {
              const ext = value[k as keyof typeof value];
              if (ext && typeof ext === 'object') {
                const e = ext as Record<string, unknown>;
                const data = e.data;
                const cachedAt = e.cachedAt;
                const updatedAt = e.updatedAt;
                if (data === undefined) {
                  throw new Error('Data not found');
                }
                if (
                  typeof cachedAt === 'string' &&
                  !DateTime.fromISO(cachedAt).isValid
                ) {
                  throw new Error('Invalid cachedAt Date');
                }
                if (
                  typeof updatedAt === 'string' &&
                  !DateTime.fromISO(updatedAt).isValid
                ) {
                  throw new Error('Invalid updatedAt Date');
                }
              } else {
                throw new Error('Invalid ext');
              }
            });
            return true;
          } catch (error) {
            return false;
          }
        }
        return false;
      },
    },
    KeyInfo: {
      type: Object,
      schema: {
        name: {
          type: String,
          required: true,
        },
        label: {
          type: String,
          required: false,
        },
      },
    },
    BlockAction: {
      type: [String, type.NULL],
      validate: validateStructureAuditAction,
      required: true,
    },
    AttribActions: {
      type: Object,
      schema: {
        type: {
          type: [String, type.NULL],
          validate: validateAuditAction,
          required: true,
        },
        data: {
          type: [String, type.NULL],
          validate: validateAuditAction,
          required: true,
        },
        ext: {
          type: Object,
          validate: (value) => {
            if (
              value &&
              typeof value === 'object' &&
              !(value instanceof Date) &&
              !(value instanceof Buffer) &&
              !(value instanceof Array)
            ) {
              try {
                Object.keys(value).forEach((k) => {
                  const action = value[k as keyof typeof value];
                  if (!validateAuditAction(action)) {
                    throw new Error('Invalid attribActions > audit action');
                  }
                });
                return true;
              } catch (error) {
                return false;
              }
            }
            return false;
          },
          required: false,
        },
        keyInfo: {
          type: Object,
          schema: {
            label: {
              type: [String, type.NULL],
              validate: validateAuditAction,
            },
          },
          required: false,
        },
      },
    },
    VfCntPosVr: {
      type: Number,
      default: 0,
      required: true,
    },
    VfCntNegBA: {
      type: Number,
      default: 0,
      required: true,
    },
    AuditedBy: {
      type: String,
      required: true,
    },
    Schema: {
      type: Number,
      default: 1,
      required: true,
    },
  },
  { saveUnknown: ['Data.file.**', 'Ext.*', 'AttribActions.ext.**'] }
);

export default BlockVersionSchema;
