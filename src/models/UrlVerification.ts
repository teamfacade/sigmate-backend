import { BelongsTo, HasOne, Model, Table } from 'sequelize-typescript';
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
  createdByDevice: UserDevice;
  createdBy?: User;
  deletedByDevice?: UserDevice;
  deletedBy?: User;
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
  @BelongsTo(() => VerificationType, 'vtypeId')
  verficationType!: UrlVerificationAttributes['verificationType'];

  @HasOne(() => Opinion, 'urlVerificationId')
  verificationOpinion!: UrlVerificationAttributes['verificationOpinion'];

  @BelongsTo(() => Url, 'urlId')
  subject!: UrlVerificationAttributes['subject'];

  @BelongsTo(() => UserDevice, 'createdByDeviceId')
  createdByDevice!: UrlVerificationAttributes['createdByDevice'];

  @BelongsTo(() => User, 'createdById')
  createdBy!: UrlVerificationAttributes['createdBy'];

  @BelongsTo(() => UserDevice, 'deletedByDeviceId')
  deletedByDevice: UrlVerificationAttributes['deletedByDevice'];

  @BelongsTo(() => User, 'deletedById')
  deletedBy: UrlVerificationAttributes['deletedBy'];
}
