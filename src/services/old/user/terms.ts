import { UserDTO, UserIdType } from '../../models/User';
import { updateUser } from '../database/user';

export const agreeToTerms = async (
  userId: UserIdType,
  {
    agreeToTos = false,
    agreeToPrivacy = false,
    agreeToLegal = false,
  }: { agreeToTos: boolean; agreeToPrivacy: boolean; agreeToLegal: boolean } = {
    agreeToTos: true,
    agreeToPrivacy: true,
    agreeToLegal: true,
  }
) => {
  const d = new Date();
  const userDTO: UserDTO = { userId };
  if (agreeToTos) userDTO.agreeTos = d;
  if (agreeToPrivacy) userDTO.agreePrivacy = d;
  if (agreeToLegal) userDTO.agreeLegal = d;
  return await updateUser(userDTO);
};
