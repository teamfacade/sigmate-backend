import { DateTime } from 'luxon';
import {
  MintingScheduleResponse,
  MintingScheduleResponseConcise,
} from '../../models/MintingSchedule';

export const groupMintingScheduleResponseByDay = (
  msrs: MintingScheduleResponse[] | MintingScheduleResponseConcise[]
) => {
  const grouped: Record<
    number,
    MintingScheduleResponse[] | MintingScheduleResponseConcise[]
  > = {};
  msrs.forEach((msr) => {
    if (msr.mintingTime) {
      // Minting Time
      const mt = DateTime.fromJSDate(msr.mintingTime, { zone: 'utc' })
        .startOf('day')
        .toMillis();
      if (!grouped[mt]) grouped[mt] = [];
      grouped[mt].push(msr);
    }
  });
  return grouped;
};
