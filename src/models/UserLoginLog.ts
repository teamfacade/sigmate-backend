import { Model, Table } from 'sequelize-typescript';

@Table({
  tableName: 'user_logins',
})
export default class UserLogin extends Model {}
