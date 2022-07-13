// import { DataType, Model, Sequelize } from 'sequelize-typescript';
// import { userIdDataType, UserIdType } from './User';

// export interface UserPreferenceCreationAttributes {
//   userId: UserIdType;
//   locale?: string;
//   theme?: string;
//   emailEssential?: boolean;
//   emailMarketing?: boolean;
//   cookiesEssential?: boolean;
//   cookiesAnalytics?: boolean;
//   cookiesFunctional?: boolean;
//   cookiesTargeting?: boolean;
//   agreeTos?: Date;
//   agreePrivacy?: Date;
//   agreeLegal?: Date;
// }

// export type UserPreferenceInstanceAttributes =
//   Required<UserPreferenceCreationAttributes>;

// export const defaultPreferences = {
//   locale: 'en-US',
//   theme: 'light',
//   emailEssential: true,
//   emailMarketing: true,
//   cookiesEssential: true,
//   cookiesAnalytics: false,
//   cookiesFunctional: false,
//   cookiesTargeting: false,
//   agreeTos: null,
//   agreePrivacy: null,
//   agreeLegal: null,
// };

// export default class UserPreference extends Model<
//   UserPreferenceCreationAttributes,
//   UserPreferenceInstanceAttributes
// > {
//   public readonly userId!: UserIdType;

//   public locale: string;
//   public theme: string;
//   public emailEssential: boolean;
//   public emailMarketing: boolean;
//   public cookiesEssential: boolean;
//   public cookiesAnalytics: boolean;
//   public cookiesFunctional: boolean;
//   public cookiesTargeting: boolean;
//   public agreeTos: Date;
//   public agreePrivacy: Date;
//   public agreeLegal: Date;

//   public readonly createdAt: Date;
//   public readonly updatedAt: Date;
// }

// export function initUserPreference(sequelize: Sequelize) {
//   return UserPreference.init(
//     {
//       userId: {
//         type: userIdDataType,
//         primaryKey: true,
//       },
//       locale: {
//         type: DataType.STRING(5),
//         allowNull: false,
//         defaultValue: defaultPreferences.locale,
//       },
//       theme: {
//         type: DataType.STRING(5),
//         allowNull: false,
//         defaultValue: defaultPreferences.theme,
//       },
//       emailEssential: {
//         type: DataType.BOOLEAN,
//         allowNull: false,
//         defaultValue: defaultPreferences.emailEssential,
//       },
//       emailMarketing: {
//         type: DataType.BOOLEAN,
//         allowNull: false,
//         defaultValue: defaultPreferences.emailMarketing,
//       },
//       cookiesEssential: {
//         type: DataType.BOOLEAN,
//         allowNull: false,
//         defaultValue: defaultPreferences.cookiesEssential,
//       },
//       cookiesAnalytics: {
//         type: DataType.BOOLEAN,
//         allowNull: false,
//         defaultValue: defaultPreferences.cookiesAnalytics,
//       },
//       cookiesFunctional: {
//         type: DataType.BOOLEAN,
//         allowNull: false,
//         defaultValue: defaultPreferences.cookiesFunctional,
//       },
//       cookiesTargeting: {
//         type: DataType.BOOLEAN,
//         allowNull: false,
//         defaultValue: defaultPreferences.cookiesTargeting,
//       },
//       agreeTos: {
//         type: DataType.DATE,
//       },
//       agreePrivacy: {
//         type: DataType.DATE,
//       },
//       agreeLegal: {
//         type: DataType.DATE,
//       },
//     },
//     {
//       sequelize,
//       tableName: 'user_preferences',
//       modelName: 'UserPreference',
//       timestamps: true,
//       underscored: true,
//       charset: 'utf8',
//       collate: 'utf8_general_ci',
//     }
//   );
// }
export {};
