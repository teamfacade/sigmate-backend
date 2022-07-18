import db from '../models';
import UserGroup from '../models/UserGroup';

const syncDatabase = () => {
  db.sequelize
    .sync({ force: true, logging: false })
    .then(() => {
      console.log('✅ Database initialized and synced');

      db.sequelize
        .transaction(async (transaction) => {
          await UserGroup.create(
            {
              groupId: 'unauthenticated',
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
              groupId: 'banned',
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
              groupId: 'newbie',
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
              groupId: 'authenticated',
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
              groupId: 'certified',
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
              groupId: 'admin',
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
    })
    .catch((error) => {
      console.log('❌ Database initialization failed');
      throw error;
    });
};

export default syncDatabase;
