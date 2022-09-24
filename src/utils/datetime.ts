import { DateTime } from 'luxon';

export const createDateTime = (
  value: string | Date | DateTime | null | undefined
) => {
  if (!value) return null;
  if (value instanceof DateTime) return value;
  if (value instanceof Date) return DateTime.fromJSDate(value);
  if (typeof value !== 'string') return null;
  return DateTime.fromISO(value);
};
