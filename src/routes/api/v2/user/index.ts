import { Router } from 'express';
import controller from '../../../../controllers';

const userController = controller.api.v2.user;

const useUserRoutes = (router: Router) => {
  router
    .route('/user')
    .get(userController.getMyInfo)
    .post(userController.createUser);

  router.route('/user/:id').get(userController.getMyInfo);
};

export default useUserRoutes;
