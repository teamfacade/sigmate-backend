import { randomBytes } from 'crypto';

/**
 * Generate new referral code for a user
 * This function does not gurantee that the generated referral code is unique
 * @returns Referral Code
 */

const CODE_PREFIX = 'sg-';
export const generateReferralCode = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    randomBytes(6, (err, buf) => {
      if (err) {
        reject(err);
      }
      const bufStr = buf.toString('hex');
      const code = CODE_PREFIX + bufStr.slice(0, 6) + '-' + bufStr.slice(6, 12);
      resolve(code);
    });
  });
};
