type UserId = number;

type UserServiceOptions = {
  id?: UserId;
  userName?: string;
  accessToken?: string;
  refreshToken?: string;
};

export default class UserService {
  constructor(options: UserServiceOptions = {}) {
    const { id, userName, accessToken, refreshToken } = options;
    if (!id && !userName && !accessToken && !refreshToken) {
      // TODO Service Error
      throw new Error('UserServiceError');
    }
  }
}
