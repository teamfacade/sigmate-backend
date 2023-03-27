import { Table, Model, ForeignKey, Column } from 'sequelize-typescript';
import { NftAttribs, Nft } from './Nft.model';
import { WikiTagAttribs, WikiTag } from '../wiki/WikiTag.model';

/**
 * Through table between WikiTag and Nft
 */
@Table({
  modelName: 'NftTag',
  tableName: 'nft_tags',
  timestamps: false,
  underscored: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export class NftTag extends Model {
  @ForeignKey(() => Nft)
  @Column
  nftId!: NftAttribs['id'];

  @ForeignKey(() => WikiTag)
  @Column
  tagId!: WikiTagAttribs['id'];
}
