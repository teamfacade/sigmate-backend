import {
  AllowNull,
  BelongsTo,
  HasOne,
  Model,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize/types';
import Opinion from './Opinion';
import Url from './Url';
import User from './User';
import UserDevice from './UserDevice';
import VerificationType from './VerificationType';

export interface UrlVerificationAttributes {
  id: number;
  verificationType: VerificationType;
  verificationOpinion?: Opinion;
  subject: Url;
  creatorDevice: UserDevice;
  creator?: User;
}

export type UrlVerificationCreationAttributes = Optional<
  UrlVerificationAttributes,
  'id'
>;

@Table({
  tableName: 'url_verifications',
  modelName: 'UrlVerification',
  timestamps: true,
  paranoid: true,
  underscored: true,
})
export default class UrlVerification extends Model<
  UrlVerificationAttributes,
  UrlVerificationCreationAttributes
> {
  @BelongsTo(() => VerificationType)
  verficationType!: UrlVerificationAttributes['verificationType'];

  @HasOne(() => Opinion)
  verificationOpinion!: UrlVerificationAttributes['verificationOpinion'];

  @BelongsTo(() => Url)
  subject!: UrlVerificationAttributes['subject'];

  @AllowNull(false)
  @BelongsTo(() => UserDevice)
  creatorDevice!: UrlVerificationAttributes['creatorDevice'];

  @BelongsTo(() => User)
  creator!: UrlVerificationAttributes['creator'];
}
