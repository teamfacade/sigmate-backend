import passport from 'passport';
import jwtStrategy from './jwt';

const setPassportStrategies = () => {
  passport.use(jwtStrategy);
};

export default setPassportStrategies;
