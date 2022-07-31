import Block from './Block';
import Opinion from './Opinion';
import User from './User';
import UserDevice from './UserDevice';

export interface BlockVerificationAttributes {
  id: number;
  vtype: number;
  opinion: Opinion;
  subject: Block;
  creatorDevice: UserDevice;
  creator: User;
}
