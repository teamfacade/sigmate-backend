import {
  AllowNull,
  BeforeDestroy,
  Column,
  DataType,
  HasMany,
  Length,
  Model,
  Table,
  Unique,
} from 'sequelize-typescript';
import { InstanceDestroyOptions, Optional } from 'sequelize/types';
import GroupPolicy from './GroupPolicy.model';
import Mission from './Mission.model';
import Penalty from './Penalty.model';
import PointPolicy from './PointPolicy.model';
import PrivilegePolicy from './PrivilegePolicy.model';

// A dollar sign followed by UNIX epoch timestamp (milliseconds)
// e.g. email@email.com$1668133802617
const ACTION_DELETE_SUFFIX_LENGTH = 14;

export interface ActionAttribs {
  id: number;
  /** Unique action 'name' used within server source code */
  name: string;
  /**
   * A more human-friendly/readable unique action name
   * to be visible to end users
   * (mostly admins when configuring missions or penalties)
   */
  label: string;

  // Associations
  groupPolicies?: GroupPolicy[];
  privilegePolicies?: PrivilegePolicy[];
  pointPolicies?: PointPolicy[];
  missions?: Mission[];
  penalties?: Penalty[];

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

type ActionCAttribs = Optional<ActionAttribs, 'id' | 'createdAt' | 'updatedAt'>;

@Table({
  modelName: 'Action',
  tableName: 'actions',
  timestamps: true,
  underscored: true,
  paranoid: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_general_ci',
})
export default class Action extends Model<ActionAttribs, ActionCAttribs> {
  @Length({ min: 1, max: 191 - ACTION_DELETE_SUFFIX_LENGTH })
  @Unique('actions.name')
  @AllowNull(false)
  @Column(DataType.STRING(191))
  name!: ActionAttribs['name'];

  @Length({ min: 1, max: 191 - ACTION_DELETE_SUFFIX_LENGTH })
  @Unique('actions.label')
  @AllowNull(false)
  @Column(DataType.STRING(191))
  label!: ActionAttribs['label'];

  @HasMany(() => GroupPolicy, { foreignKey: 'actionId' })
  groupPolicies: ActionAttribs['groupPolicies'];

  @HasMany(() => PrivilegePolicy, { foreignKey: 'actionId' })
  privilegePolicies: ActionAttribs['privilegePolicies'];

  @HasMany(() => PointPolicy, { foreignKey: 'actionId' })
  pointPolicies: ActionAttribs['pointPolicies'];

  @HasMany(() => Mission, { foreignKey: 'actionId' })
  missions: ActionAttribs['missions'];

  @HasMany(() => Penalty, { foreignKey: 'actionId' })
  penalties: ActionAttribs['penalties'];

  @BeforeDestroy
  static async handleDestroy(
    instances: Action | Action[],
    options: InstanceDestroyOptions
  ) {
    if (instances) {
      if (!(instances instanceof Array)) {
        instances = [instances];
      }

      // Add delete suffixes to unique columns
      const uniqueAttribs: (keyof ActionAttribs)[] = ['name', 'label'];
      const deleteSuffix = `$${Date.now()}`;
      for (const i in instances) {
        const instance = instances[i];
        if (instance?.id) {
          await instance.reload({
            attributes: ['id', ...uniqueAttribs],
            transaction: options?.transaction,
          });
          uniqueAttribs.forEach((attrib) => {
            const value = instance.getDataValue(attrib);
            if (value && typeof value === 'string') {
              instance.set(attrib, value + deleteSuffix);
            }
          });
          await instance.save({ transaction: options?.transaction });
        }
      }
    }
  }
}
