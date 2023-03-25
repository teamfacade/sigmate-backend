import { UserId } from '../User.model';

/** `VR#Wiki#Document#{ID}` */
type BlockVerificationPK = string;
/**
 * `Block#{BLOCKID}#{TIMESTAMP}#{USERID}`
 * * `TIMESTAMP`: Unix epoch (ms)
 */
type BlockVerificationSK = string;

/**
 * Verifications with "positive" meaning. Starts with `P_`
 * * `P_VR`: Verify
 */
type PositiveVerificationType = 'P_VR';
/**
 * Verifications with "negative" meaning. Starts with `N_`
 * * `N_BA`: Be aware
 */
type NegativeVerificationType = 'N_BA';

type AnyVerificationType = PositiveVerificationType | NegativeVerificationType;

export interface BlockVerification {
  PK: BlockVerificationPK;
  SK: BlockVerificationSK;
  type: AnyVerificationType;
  createdBy: UserId;
}
