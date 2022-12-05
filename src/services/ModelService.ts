import { body, query, param, ValidationChain } from 'express-validator';
import Service from './Service';

// eslint-disable-next-line @typescript-eslint/ban-types
export type ValidateOptions<ModelAttribs extends {}> = {
  location: keyof typeof VCHAINS;
  fields: (keyof ModelAttribs)[];
  fieldPrefix?: string;
  optional?: boolean;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export type ValidateOneOptions<ModelAttribs extends {}> = {
  chain: ValidationChain;
  field: keyof ModelAttribs;
};
const VCHAINS = Object.freeze({ body, query, param });

export default abstract class ModelService<
  ModelAttribs extends {} // eslint-disable-line @typescript-eslint/ban-types
> extends Service {
  /** express-validator `ValidationChain` factories for method `validate` */
  public abstract validateOne(
    options: ValidateOneOptions<ModelAttribs>
  ): ValidationChain;
  public validate(options: ValidateOptions<ModelAttribs>): ValidationChain[] {
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
