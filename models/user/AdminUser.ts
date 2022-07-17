import { DataType, Model, Sequelize, Table } from 'sequelize-typescript';
import { DatabaseObject } from '../';
import { userIdDataType, UserIdType } from './User';

interface AdminUserCreationAttributes {
  userId: string;
  appointedBy: string;
  appointedAt?: Date;
  canAdminContent?: boolean;
  canAdminUsers?: boolean;
  canAdminEvents?: boolean;
  canAdminAds?: boolean;
  canAppointAdmins?: boolean;
}

export type AdminUserInstanceAttributes = Required<AdminUserCreationAttributes>;

@Table
export default class AdminUser extends Model<
  AdminUserCreationAttributes,
  AdminUserInstanceAttributes
> {
  public readonly userId!: UserIdType;
  public appointedBy!: UserIdType;
  public appointedAt!: Date;
  public canAdminContent!: boolean;
  public canAdminUsers!: boolean;
  public canAdminEvents!: boolean;
  public canAdminAds!: boolean;
  public canAppointAdmins!: boolean;
}

export function initAdminUser(sequelize: Sequelize) {
  return AdminUser.init(
    {
      userId: {
        type: userIdDataType,
        primaryKey: true,
      },
      appointedBy: {
        type: userIdDataType,
        allowNull: false,
      },
      appointedAt: {
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW,
      },
      canAdminContent: {
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      canAdminUsers: {
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      canAdminEvents: {
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      canAdminAds: {
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      canAppointAdmins: {
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      tableName: 'admin_users',
      modelName: 'AdminUser',
      timestamps: true,
      underscored: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_general_ci',
    }
  );
}

export function associateAdminUser(db: DatabaseObject) {
  // One admin user - one user
  db.AdminUser.belongsTo(db.User, {
    foreignKey: 'userId',
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  });

  // Many admin users can be appointed by one user
  db.AdminUser.belongsTo(db.User, {
    foreignKey: 'appointedBy',
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  });
}
