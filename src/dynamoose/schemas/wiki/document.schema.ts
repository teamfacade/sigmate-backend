import { Schema, type } from 'dynamoose';
import { SchemaDefinition } from 'dynamoose/dist/Schema';
import { DIFF_ACTIONS, DIFF_RESULTS, DOCUMENT_TYPES } from '.';

const TITLE_SIZE_MIN = 3;
const TITLE_SIZE_MAX = 128;
const AUDIT_COMMENT_SIZE = 255;

const BLOCK_STRUCTURE: SchemaDefinition[] = [
  {
    Id: {
      type: String,
      required: true,
    },
    Diff: {
      type: String,
      enum: DIFF_RESULTS,
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
      enum: DOCUMENT_TYPES,
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
      type: Set,
      schema: [String],
      required: true,
    },
    ExtClId: {
      type: Object,
      schema: {
        cache: {
          type: [String, type.NULL],
          required: true,
        },
        cachedAt: {
          type: [String, type.NULL],
          required: true,
        },
        updatedAt: String,
      },
      required: false,
    },
    ExtNftId: {
      type: Object,
      schema: {
        cache: {
          type: [String, type.NULL],
          required: true,
        },
        cachedAt: {
          type: [String, type.NULL],
          required: true,
        },
        updatedAt: String,
      },
      required: false,
    },
    ExtClDiscord: {
      type: Object,
      schema: {
        cache: {
          type: [String, type.NULL],
          required: true,
        },
        cachedAt: {
          type: [String, type.NULL],
          required: true,
        },
        updatedAt: String,
      },
      required: false,
    },
    ExtClTwitter: {
      type: Object,
      schema: {
        cache: {
          type: [String, type.NULL],
          required: true,
        },
        cachedAt: {
          type: [String, type.NULL],
          required: true,
        },
        updatedAt: String,
      },
      required: false,
    },
    ExtClTelegram: {
      type: Object,
      schema: {
        cache: {
          type: [String, type.NULL],
          required: true,
        },
        cachedAt: {
          type: [String, type.NULL],
          required: true,
        },
        updatedAt: String,
      },
      required: false,
    },
    ExtClWebsite: {
      type: Object,
      schema: {
        cache: {
          type: [String, type.NULL],
          required: true,
        },
        cachedAt: {
          type: [String, type.NULL],
          required: true,
        },
        updatedAt: String,
      },
      required: false,
    },
    ExtClChains: {
      type: Object,
      schema: {
        cache: {
          type: [Array, type.NULL],
          schema: [
            {
              symbol: {
                type: String,
                required: true,
              },
            },
          ],
          required: true,
        },
        cachedAt: {
          type: [String, type.NULL],
          required: true,
        },
        updatedAt: String,
      },
      required: false,
    },
    ExtClMarketplaces: {
      type: Object,
      schema: {
        cache: {
          type: [Array, type.NULL],
          schema: [
            {
              id: Number,
              name: String,
              url: String,
              collectionUrl: {
                type: String,
                required: false,
              },
              logoImage: {
                type: String,
                required: false,
              },
            },
          ],
          required: true,
        },
        cachedAt: {
          type: [String, type.NULL],
          required: true,
        },
        updatedAt: String,
      },
      required: false,
    },
    ExtClCategory: {
      type: Object,
      schema: {
        cache: {
          type: [Object, type.NULL],
          schema: {
            cache: {
              type: [Object, type.NULL],
              schema: {
                id: Number,
                name: String,
              },
              required: true,
            },
            cachedAt: {
              type: [String, type.NULL],
              required: true,
            },
            updatedAt: String,
          },
        },
      },
      required: false,
    },
    ExtClFloorPrice: {
      type: Object,
      schema: {
        cache: {
          type: [Object, type.NULL],
          schema: {
            cache: {
              type: [Object, type.NULL],
              schema: {
                floorPrice: Number,
                floorPriceCurrency: {
                  type: Object,
                  schema: {
                    symbol: String,
                  },
                },
              },
              required: true,
            },
            cachedAt: {
              type: [String, type.NULL],
              required: true,
            },
            updatedAt: String,
          },
        },
      },
      required: false,
    },
    ExtClMintingPrices: {
      type: Object,
      schema: {
        cache: {
          type: [Object, type.NULL],
          schema: {
            cache: {
              type: [Object, type.NULL],
              schema: {
                id: Number,
                name: String,
                price: Number,
                priceUpdatedAt: String, // ISO timestamp
                startsAt: String, // ISO timestamp
                startsAtPrecision: String,
              },
              required: true,
            },
            cachedAt: {
              type: [String, type.NULL],
              required: true,
            },
            updatedAt: String,
          },
        },
      },
      required: false,
    },
    Version: {
      type: String,
      required: false,
    },
    IsLatest: {
      type: Boolean,
      required: true,
    },
    BuildVersionStart: {
      type: String,
      required: true,
    },
    BuildVersionEnd: {
      type: String,
      required: true,
    },
    Action: {
      type: String,
      enum: DIFF_ACTIONS,
      required: true,
    },
    Diff: {
      type: Object,
      schema: {
        Type: {
          type: String,
          enum: DIFF_ACTIONS,
          required: false,
        },
        Title: {
          type: String,
          enum: DIFF_ACTIONS,
          required: false,
        },
        KeyInfo: {
          type: String,
          enum: DIFF_RESULTS,
          required: false,
        },
        Content: {
          type: String,
          enum: DIFF_RESULTS,
          required: false,
        },
        Tags: {
          type: Object,
          required: false,
        },
      },
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
  { saveUnknown: ['Diff.Tags.*'] }
);

export default DocumentVersionSchema;
