import { DateTime } from 'luxon';
import { MintingScheduleResponse } from '../../models/MintingSchedule';

export const groupMintingScheduleResponseByDay = (
  msrs: MintingScheduleResponse[]
) => {
  const grouped: Record<number, MintingScheduleResponse[]> = {};
  msrs.forEach((msr) => {
    if (msr.mintingTime) {
      // Minting Time
      const mt = DateTime.fromJSDate(msr.mintingTime).startOf('day').toMillis();
      if (!grouped[mt]) grouped[mt] = [];
      grouped[mt].push(msr);
    }
  });
  console.log(grouped);
  return grouped;
};
