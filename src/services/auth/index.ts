import Action from '../Action';
import Service from '../Service';
import Token from './Token';
import User from './User';

export default class Auth extends Service {
  name = 'AUTH';
  get serviceStatus() {
    return Auth.status;
  }
  constructor() {
    super();
  }

  async signup(parentAction: Action | undefined = undefined) {
    // TODO test code. re-write.
    const action = new Action({
      type: Action.TYPE.SERVICE,
      name: 'AUTH_SIGNUP',
      transaction: true,
      parent: parentAction,
    });

    return await action.run(async (transaction, action) => {
      const user = new User();
      await user.create(
        {
          google: {
            email: 'yw.sean.kim@gmail.com',
            googleAccount: 'yw.sean.kim@gmail.com',
            googleAccountId: '109463017188060808945',
            profileImageUrl: '',
          },
        },
        action
      );

      const atoken = new Token({ type: 'ACCESS', user });
      const rtoken = new Token({ type: 'REFRESH', user });
      return {
        user: user.model?.toJSON(),
        accessToken: await atoken.renew(action),
        refreshToken: await rtoken.renew(action),
      };
    });
  }
}
