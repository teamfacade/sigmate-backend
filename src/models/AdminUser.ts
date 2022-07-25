import {
  Column,
  Model,
  Sequelize,
  Table,
  DataType,
} from 'sequelize-typescript';
import { DatabaseObject } from '.';
import { userIdDataType, UserIdType } from './User';

export interface AdminUserModelAttributes {
  userId: UserIdType;
  appointedBy: string;
  appointedAt: Date;
  canAdminContent: boolean;
  canAdminUsers: boolean;
  canAdminEvents: boolean;
  canAdminAds: boolean;
  canAppointAdmins: boolean;
}

export type AdminUserCreationAttributes = AdminUserModelAttributes;

@Table
export default class AdminUser extends Model<
  AdminUserModelAttributes,
  AdminUserCreationAttributes
> {
  @Column
  public readonly userId!: string;
  @Column
  public appointedBy!: string;
  @Column
  public appointedAt!: Date;
  @Column
  public canAdminContent!: boolean;
  @Column
  public canAdminUsers!: boolean;
  @Column
  public canAdminEvents!: boolean;
  @Column
  public canAdminAds!: boolean;
  @Column
  public canAppointAdmins!: boolean;
}

export const initAdminUser = (sequelize: Sequelize) => {
  AdminUser.init(
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
};

export const associateAdminUser = (db: DatabaseObject) => {
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
};
