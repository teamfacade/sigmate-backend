import BaseService from './BaseService';
import { body, query, param } from 'express-validator';

export default abstract class ModelService extends BaseService {
  static VALIDATOR = { body, query, param };

  constructor() {
    super();
  }
}
