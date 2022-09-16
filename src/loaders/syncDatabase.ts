import db from '../models';
import UserGroup from '../models/UserGroup';

const forceSync = true;

const syncDatabase = () => {
  console.log('Starting database sync...');
  db.sequelize
    .sync({ force: forceSync, logging: false })
    .then(() => {
      console.log('✅ Database initialized and synced');

      if (forceSync) {
        db.sequelize
          .transaction(async (transaction) => {
            await UserGroup.create(
              {
                groupName: 'unauthenticated',
                canCreateDocument: true,
                canEditDocument: false,
                canReqeustDocumentEdit: true,
                canVerify: true,
                canParticipateEvent: false,
                canReceivePoints: false,
                canReceiveReferrals: false,
                canTransferToken: false,
              },
              { transaction, logging: false }
            );

            await UserGroup.create(
              {
                groupName: 'banned',
                canCreateDocument: false,
                canEditDocument: false,
                canReqeustDocumentEdit: false,
                canVerify: false,
                canParticipateEvent: false,
                canReceivePoints: false,
                canReceiveReferrals: false,
                canTransferToken: false,
              },
              { transaction, logging: false }
            );

            await UserGroup.create(
              {
                groupName: 'newbie',
                canCreateDocument: true,
                canEditDocument: false,
                canReqeustDocumentEdit: true,
                canVerify: true,
                canParticipateEvent: true,
                canReceivePoints: true,
                canReceiveReferrals: true,
                canTransferToken: false,
              },
              { transaction, logging: false }
            );

            await UserGroup.create(
              {
                groupName: 'authenticated',
                canCreateDocument: true,
                canEditDocument: true,
                canReqeustDocumentEdit: true,
                canVerify: true,
                canParticipateEvent: true,
                canReceivePoints: true,
                canReceiveReferrals: true,
                canTransferToken: true,
              },
              { transaction, logging: false }
            );

            await UserGroup.create(
              {
                groupName: 'certified',
                canCreateDocument: true,
                canEditDocument: true,
                canReqeustDocumentEdit: true,
                canVerify: true,
                canParticipateEvent: true,
                canReceivePoints: true,
                canReceiveReferrals: true,
                canTransferToken: true,
              },
              { transaction, logging: false }
            );

            await UserGroup.create(
              {
                groupName: 'admin',
                canCreateDocument: true,
                canEditDocument: true,
                canReqeustDocumentEdit: true,
                canVerify: true,
                canParticipateEvent: true,
                canReceivePoints: true,
                canReceiveReferrals: true,
                canTransferToken: true,
              },
              { transaction, logging: false }
            );
          })
          .then(() => {
            console.log(`✅ User groups successfully initialized.`);
          })
          .catch((err) => {
            console.error(err);
            console.log(`❌ Failed to initialize user groups.`);
          });
      }
    })
    .catch((error) => {
      console.log('❌ Database initialization failed');
      throw error;
    });
};

export default syncDatabase;
