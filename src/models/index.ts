import fs from 'fs';
import path from 'path';
import { Model, ModelCtor } from 'sequelize-typescript';

const models: ModelCtor<Model<any, any>>[] = [];

const imports: Promise<unknown>[] = fs
  .readdirSync(__dirname)
  .filter(
    (file) =>
      file.indexOf('.') !== 0 && // ignore dotfiles
      file !== path.basename(__filename) && // ignore this file (index.ts)
      file.slice(-9, -3) === '.model' &&
      (file.slice(-3) === '.js' || file.slice(-3) === '.ts')
  )
  .map((file) =>
    import(path.join(__dirname, file.slice(0, -3))).then(
      (module) => module.default && models.push(module.default)
    )
  );

/**
 * Dynamically import all modules named "*.model.ts" in this directory
 */
export const importModels = async () => {
  await Promise.all(imports);
};

export default models;
