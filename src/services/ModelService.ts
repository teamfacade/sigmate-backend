import { body, query, param, ValidationChain } from 'express-validator';
import { Model } from 'sequelize-typescript';
import Service from './Service';

export type MySQL$TEXT = string;

// eslint-disable-next-line @typescript-eslint/ban-types
export type ValidateOptions<F = string> = {
  location: keyof typeof VCHAINS;
  fields: F[];
  fieldPrefix?: string;
  optional?: boolean;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export type ValidateOneOptions<F = string> = {
  chain: ValidationChain;
  field: F;
};
const VCHAINS = Object.freeze({ body, query, param });

export default abstract class ModelService<
  ModelAttribs extends {}, // eslint-disable-line @typescript-eslint/ban-types
  ModelCAttribs extends {} = ModelAttribs // eslint-disable-line @typescript-eslint/ban-types
> extends Service {
  public abstract model?:
    | Model<ModelAttribs, ModelCAttribs>
    | Model<ModelAttribs, ModelCAttribs>[];

  public get found() {
    if (!this.model) return false;
    if (this.model instanceof Array) {
      return Boolean(this.model.length);
    }
    return Boolean(this.model);
  }
  public unset() {
    this.model = undefined;
  }

  /** express-validator `ValidationChain` factories for method `validate` */
  public static validateOne(options: ValidateOneOptions): ValidationChain {
    return options.chain;
  }

  public static validate(options: ValidateOptions): ValidationChain[] {
    const { location, fields, fieldPrefix = '', optional = false } = options;
    const chains: ValidationChain[] = [];
    fields.forEach((field) => {
      const chain = VCHAINS[location](fieldPrefix + String(field));
      if (optional) chain.optional();
      chains.push(this.validateOne({ chain, field }));
    });
    return chains;
  }
}
