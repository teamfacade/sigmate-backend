import {
  AllowNull,
  Column,
  DataType,
  Default,
  IsIn,
  Model,
} from 'sequelize-typescript';
import { DropletId } from '../../utils/droplet';
import { MintingEventAttribs } from './MintingEvent.model';

/** If date is unknown, or for real-time events */
type DatePrecision = 'month' | 'week' | 'day' | 'time';

export interface EventAttribs {
  id: DropletId;
  name: string;
  description?: string;
  startsAt: Date;
  startsAtPrecision: DatePrecision;
  endsAt?: Date;
  endsAtPrecision?: DatePrecision;
  isAllday: boolean;
  /** Number of users who saved this event to their calendar */
  savedCount: number;

  createdAt: Date;
  updatedAt: Date;
}

export class CalendarEvent<
  Attribs extends EventAttribs
> extends Model<Attribs> {
  @AllowNull(false)
  @Column(DataType.STRING(191))
  name!: MintingEventAttribs['name'];

  @Column(DataType.TEXT)
  description: MintingEventAttribs['description'];

  @AllowNull(false)
  @Column(DataType.DATE)
  startsAt!: MintingEventAttribs['startsAt'];

  @IsIn([['month', 'week', 'day', 'time']])
  @Default('time')
  @AllowNull(false)
  @Column(DataType.STRING(8))
  startsAtPrecision!: MintingEventAttribs['startsAtPrecision'];

  @Column(DataType.DATE)
  endsAt: MintingEventAttribs['endsAt'];

  @IsIn([['month', 'week', 'day', 'time']])
  @Column(DataType.STRING(8))
  endsAtPrecision: MintingEventAttribs['endsAtPrecision'];

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  isAllday!: MintingEventAttribs['isAllday'];

  @Default(0)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  savedCount!: MintingEventAttribs['savedCount'];

  @Default(DataType.NOW)
  @AllowNull(false)
  @Column(DataType.DATE)
  createdAt!: MintingEventAttribs['createdAt'];

  @Default(DataType.NOW)
  @AllowNull(false)
  @Column(DataType.DATE)
  updatedAt!: MintingEventAttribs['updatedAt'];
}
