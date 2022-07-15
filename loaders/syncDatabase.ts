import db from '../models';

const syncDatabase = () => {
  db.sequelize
    .sync({ force: true })
    .then(() => {
      console.log('✅ Database initialized and synced');
    })
    .catch((error) => {
      console.error(error);
      console.log('❌ Database initialization failed');
    });
};

export default syncDatabase;
