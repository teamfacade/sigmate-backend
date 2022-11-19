import BaseService from './BaseService';
import { body, query, param, ValidationChain } from 'express-validator';

type Location = 'body' | 'query' | 'param';

type GetValidatorsOptions = {
  fieldPrefix?: string;
};

export default abstract class ModelService extends BaseService {
  VALIDATOR = { body, query, param };

  constructor() {
    super();
  }

  public abstract getValidators(
    location: Location,
    fields: string[],
    options: GetValidatorsOptions
  ): ValidationChain[];
}
