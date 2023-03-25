// import {
//   Model,
//   Table,
//   Column,
//   DataType,
//   PrimaryKey,
//   AllowNull,
//   BelongsTo,
//   Default,
// } from 'sequelize-typescript';
// import { Optional } from 'sequelize/types';
// import { DropletId } from '../../utils/droplet';
// import { User, UserId } from '../User.model';

// export interface WikiBlockVersionMetaAttribs {
//   version: DropletId; // Primary key
//   id: DropletId;
//   updatedBy?: User;
//   updatedById?: UserId;

//   pVerifyCount: number;
//   nBeawareCount: number;
// }

// export type WikiBlockVersionMetaCAttribs = Optional<
//   WikiBlockVersionMetaAttribs,
//   'pVerifyCount' | 'nBeawareCount'
// >;

// @Table({
//   modelName: 'WikiBlockVersionMeta',
//   tableName: 'wiki_block_version_metas',
//   timestamps: false,
//   underscored: true,
//   charset: 'utf8mb4',
//   collate: 'utf8mb4_general_ci',
// })
// export class WikiBlockVersionMeta extends Model<
//   WikiBlockVersionMetaAttribs,
//   WikiBlockVersionMetaCAttribs
// > {
//   @PrimaryKey
//   @Column(DataType.STRING(32))
//   version!: WikiBlockVersionMetaAttribs['version'];

//   @AllowNull(false)
//   @Column(DataType.STRING(32))
//   id!: WikiBlockVersionMetaAttribs['id'];

//   @BelongsTo(() => User, { foreignKey: 'updatedById', as: 'updatedBy' })
//   updatedBy: WikiBlockVersionMetaAttribs['updatedBy'];

//   @Default(0)
//   @AllowNull(false)
//   @Column(DataType.INTEGER)
//   pVerifyCount!: WikiBlockVersionMetaAttribs['pVerifyCount'];

//   @Default(0)
//   @AllowNull(false)
//   @Column(DataType.INTEGER)
//   nBeawareCount!: WikiBlockVersionMetaAttribs['nBeawareCount'];
// }
