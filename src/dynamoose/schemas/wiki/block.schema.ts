import { Schema, type } from 'dynamoose';
import { WikiKey } from '.';
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
    Type: {
      type: String,
      enum: WikiBlock.SUPPORTED_TYPES,
      required: true,
    },
    Data: {
      type: [Object, type.NULL],
      required: true,
    },
    Ext: {
      type: Set,
      schema: [String],
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
    Action: {
      type: [String, type.NULL],
      required: true,
    },
    Diff: {
      type: Object,
      schema: {
        Type: { type: String, required: false },
        Data: { type: String, required: false },
        Ext: { type: Object, required: false },
        KeyInfo: { type: String, required: false },
      },
      required: true,
    },
    DocumentVersion: {
      type: String,
      required: false,
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
  { saveUnknown: ['Data.**', 'Diff.Ext.*'] }
);

export default BlockVersionSchema;
