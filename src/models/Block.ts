import { Op } from 'sequelize';
import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import BlockAudit, { BlockAuditAttributes } from './BlockAudit';
import BlockVerification, {
  BlockVerificationResponse,
} from './BlockVerification';
import Collection, {
  BlockCollectionAttrib,
  CollectionAttributes,
} from './Collection';
import Document, { DocumentAttributes } from './Document';
import Image from './Image';
import Opinion from './Opinion';
import Url from './Url';
import User from './User';
import UserDevice from './UserDevice';
import VerificationType from './VerificationType';

export type BlockIdType = number;
export interface BlockAttributes {
  id: BlockIdType;
  document?: Document;
  opinions?: Opinion[];
  element: string;
  style?: { [key: string]: string };
  textContent?: string;
  image?: Image;
  url?: Url;
  structure?: BlockIdType[];
  parent?: Block;
  children?: Block[];
  audits?: BlockAudit[];
  verifications?: BlockVerification[];

  // Block for collection attrib verification
  collection?: Collection;
  collectionId?: CollectionAttributes['id'];
  collectionAttrib?: BlockCollectionAttrib;

  createdByDevice?: UserDevice;
  createdBy?: User;
  updatedByDevice?: UserDevice;
  updatedBy?: User;
  deletedByDevice?: UserDevice;
  deletedBy?: User;
}

export type BlockCreationAttributes = Optional<BlockAttributes, 'id'>;

export type TextBlockCreationAttribs = Required<
  Pick<BlockAttributes, 'textContent'>
> &
  Pick<
    BlockAttributes,
    | 'element'
    | 'document'
    | 'style'
    | 'parent'
    | 'collectionAttrib'
    | 'createdByDevice'
    | 'createdBy'
  >;

export interface TextBlockCreationDTO extends TextBlockCreationAttribs {
  approved: boolean;
}
export interface TextBlockAuditDTO
  extends Partial<
    Pick<
      BlockAttributes,
      | 'textContent'
      | 'element'
      | 'style'
      | 'parent'
      | 'updatedBy'
      | 'updatedByDevice'
    >
  > {
  approved: boolean;
}

export type CollectionAttribBlockCreationDTO = TextBlockCreationDTO &
  Required<Pick<BlockAttributes, 'collection' | 'collectionAttrib'>>;

export interface CollectionAttribBlockDeletionDTO {
  deletedBy?: BlockAttributes['deletedBy'];
  deletedByDevice?: BlockAttributes['deletedByDevice'];
}

export interface BlockResponse
  extends Pick<
    BlockAttributes,
    'id' | 'element' | 'style' | 'textContent' | 'collectionAttrib'
  > {
  document?: Pick<DocumentAttributes, 'id' | 'title'>;
  parent?: Pick<BlockAttributes, 'id'> | null;
  children?: BlockResponse[] | null;
  lastAudit?: Pick<
    BlockAuditAttributes,
    'id' | 'createdAt' | 'approvedAt'
  > | null;
  lastApprovedAudit?: Pick<
    BlockAuditAttributes,
    'id' | 'createdAt' | 'approvedAt'
  > | null;
  verificationCounts: {
    verifyCount: number;
    beAwareCount: number;
  };
  opinionCount: number;
  myVerification?: BlockVerificationResponse | null;
  collection?: { id: CollectionAttributes['id'] };
  collectionAttrib?: BlockCollectionAttrib;
}

@Table({
  tableName: 'blocks',
  modelName: 'Block',
  timestamps: true,
  paranoid: true,
  underscored: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class Block extends Model<
  BlockAttributes,
  BlockCreationAttributes
> {
  @BelongsTo(() => Document, 'documentId')
  document: BlockAttributes['document']; // cannot edit after creation

  @HasMany(() => Opinion, 'blockId')
  opinions: BlockAttributes['opinions'];

  @AllowNull(false)
  @Column(DataType.STRING(16))
  element!: BlockAttributes['element'];

  @Column(DataType.JSON)
  style: BlockAttributes['style'];

  // A text block (no children)
  @Column(DataType.TEXT)
  textContent!: BlockAttributes['textContent'];

  // An image block (no children)
  @BelongsTo(() => Image, 'imageId')
  image!: BlockAttributes['image'];

  // An url block (no children)
  @BelongsTo(() => Url, 'urlId')
  url!: BlockAttributes['url'];

  @Column(DataType.JSON)
  structure: BlockAttributes['structure'];

  @BelongsTo(() => Block, 'parentId')
  parent: BlockAttributes['parent'];

  @HasMany(() => Block, 'parentId')
  children: BlockAttributes['children'];

  @HasMany(() => BlockAudit, 'blockId')
  audits: BlockAttributes['audits'];

  @HasMany(() => BlockVerification, 'blockId')
  verifications: BlockAttributes['verifications'];

  @BelongsTo(() => Collection, 'collectionId')
  collection: BlockAttributes['collection'];

  @Column(DataType.STRING(32))
  collectionAttrib: BlockAttributes['collectionAttrib'];

  @BelongsTo(() => UserDevice, {
    as: 'createdByDevice',
    foreignKey: 'createdByDeviceId',
  })
  createdByDevice: BlockAttributes['createdByDevice'];

  @BelongsTo(() => User, { as: 'createdBy', foreignKey: 'createdById' })
  createdBy: BlockAttributes['createdBy'];

  @BelongsTo(() => UserDevice, {
    as: 'updatedByDevice',
    foreignKey: 'updatedByDeviceId',
  })
  updatedByDevice: BlockAttributes['updatedByDevice'];

  @BelongsTo(() => User, { as: 'updatedBy', foreignKey: 'updatedById' })
  updatedBy: BlockAttributes['updatedBy'];

  @BelongsTo(() => UserDevice, {
    as: 'deletedByDevice',
    foreignKey: 'deletedByDeviceId',
  })
  deletedByDevice: BlockAttributes['deletedByDevice'];

  @BelongsTo(() => User, { as: 'deletedBy', foreignKey: 'deletedById' })
  deletedBy: BlockAttributes['deletedBy'];

  async getMyVerification(
    myself: User | null = null
  ): Promise<BlockVerification | null> {
    if (!myself) return null;
    const vs = await this.$get('verifications', {
      include: [{ model: User, as: 'createdBy', where: { id: myself.id } }],
    });
    const v: BlockVerification = vs && vs.length ? vs[0] : null;
    return v;
  }

  async toResponseJSON(myself: User | null = null): Promise<BlockResponse> {
    const [
      document,
      parent,
      children,
      lastAudit,
      lastApprovedAudit,
      verifyCount,
      beAwareCount,
      opinionCount,
      myVerification,
      collection,
    ] = await Promise.all([
      this.$get('document', { attributes: ['id', 'title'] }),
      this.$get('parent', { attributes: ['id'] }),
      this.$get('children', { where: { parentId: this.id } }),
      this.$get('audits', {
        attributes: ['id', 'createdAt', 'approvedAt'],
        where: { revertedAt: { [Op.not]: null } },
        limit: 1,
        order: [['createdAt', 'DESC']],
      }),
      this.$get('audits', {
        attributes: ['id', 'createdAt', 'approvedAt'],
        where: { approvedAt: { [Op.not]: null } },
        limit: 1,
        order: [['createdAt', 'DESC']],
      }),
      this.$count('verifications', {
        include: [
          {
            model: VerificationType,
            where: { isUpvote: true },
            attributes: ['isUpvote'],
          },
        ],
      }),
      this.$count('verifications', {
        include: [
          {
            model: VerificationType,
            where: { isUpvote: false },
            attributes: ['isUpvote'],
          },
        ],
      }),
      this.$count('opinions'),
      this.getMyVerification(myself),
      this.$get('collection', { attributes: ['id'] }),
    ]);

    const parentResponse = parent ? { id: parent.id } : null;
    const childrenResponses = await Promise.all(
      children?.map((child) => child.toResponseJSON()) || []
    );
    const myVerificationResponse: BlockVerificationResponse | null =
      myVerification && (await myVerification.toResponseJSON());
    const collectionResponse = collection ? { id: collection.id } : undefined;

    return {
      id: this.id,
      document: document
        ? { id: document.id, title: document.title }
        : undefined,
      element: this.element,
      style: this.style,
      textContent: this.textContent,
      parent: parentResponse,
      children: childrenResponses,
      lastAudit: lastAudit && lastAudit.length ? lastAudit[0] : null,
      lastApprovedAudit:
        lastApprovedAudit && lastApprovedAudit.length
          ? lastApprovedAudit[0]
          : null,
      verificationCounts: {
        verifyCount,
        beAwareCount,
      },
      opinionCount,
      myVerification: myVerificationResponse,
      collection: collectionResponse,
      collectionAttrib: this.collectionAttrib,
    };
  }
}
