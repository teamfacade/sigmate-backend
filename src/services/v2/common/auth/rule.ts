import { Model, ModelType } from 'sequelize-typescript';
import AuthError from '../errors/request/AuthError';

type TCondition<MA> = {
  [k in keyof MA]?: MA[k] | ((value: MA[k]) => boolean);
};

type ObjectCondition<MA, CA> = {
  model: ModelType<CA, MA>;
  attribs: TCondition<MA>;
};

type RuleConditions<SMA, SCA, OTMA, OTCA, OSMA, OSCA> = {
  subject?: ObjectCondition<SMA, SCA>;
  target?: ObjectCondition<OTMA, OTCA>;
  source?: ObjectCondition<OSMA, OSCA>;
};

export default class AuthRule<
  // eslint-disable-next-line @typescript-eslint/ban-types
  SMA extends {} = any,
  // eslint-disable-next-line @typescript-eslint/ban-types
  SCA extends {} = any,
  // eslint-disable-next-line @typescript-eslint/ban-types
  OTMA extends {} = any,
  // eslint-disable-next-line @typescript-eslint/ban-types
  OTCA extends {} = any,
  // eslint-disable-next-line @typescript-eslint/ban-types
  OSMA extends {} = any,
  // eslint-disable-next-line @typescript-eslint/ban-types
  OSCA extends {} = any
> {
  action: string;
  allow: boolean;
  conditions: RuleConditions<SMA, SCA, OTMA, OTCA, OSMA, OSCA>;

  constructor(
    action: string,
    allow: 'allow' | 'deny',
    conditions: RuleConditions<SMA, SCA, OTMA, OTCA, OSMA, OSCA>
  ) {
    this.action = action;
    this.allow = allow === 'allow';
    this.conditions = conditions;
  }

  private getConditionAttributes<MA, CA>(
    condition: ObjectCondition<MA, CA> | undefined
  ) {
    if (!condition) return [];
    return Object.keys(condition.attribs);
  }

  private getObjectPrecedence(conditionKey: 'subject' | 'target' | 'source') {
    const objectAll = this.conditions[conditionKey] === undefined;
    const objectConditionAttributes = this.getConditionAttributes(
      this.conditions[conditionKey as 'subject']
    );
    const objectIndividual =
      objectConditionAttributes.length === 1 &&
      objectConditionAttributes[0] === 'id';
    const objectGroup = !objectIndividual;

    return { all: objectAll, group: objectGroup };
  }

  get precedence() {
    const subject = this.getObjectPrecedence('subject');
    const target = this.getObjectPrecedence('target');
    const source = this.getObjectPrecedence('source');

    const subjectPrec = `${subject.all ? 1 : 0}${subject.group ? 1 : 0}`;
    const targetPrec = `${target.all ? 1 : 0}${target.group ? 1 : 0}`;
    const sourcePrec = `${source.all ? 1 : 0}${source.group ? 1 : 0}`;
    const allowPrec = `${this.allow ? 1 : 0}`;

    const precStr = subjectPrec + sourcePrec + targetPrec + allowPrec;

    let prec = 0;
    for (let i = 0; i < precStr.length; i++) {
      const digit = precStr[i] === '1' ? 1 : 0;
      prec += digit * 2 ** (precStr.length - i - 1);
    }

    return prec;
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  private conditionMet<MA extends {}, CA extends {}>(
    object: Model<MA, CA> | undefined,
    condition: ObjectCondition<MA, CA> | undefined
  ) {
    if (!condition) return true;
    if (!object) throw new AuthError();
    if (!(object instanceof condition.model)) {
      return false;
    }

    for (const ckey in condition.attribs) {
      const obj = object.toJSON();
      const v = obj[ckey];
      const c = condition.attribs[ckey];

      if (typeof c === 'function') {
        if (!c(v)) return false;
      } else {
        if (c !== v) return false;
      }
    }

    return true;
  }

  public check(
    subject: Model<SMA, SCA> | undefined,
    target: Model<OTMA, OTCA> | undefined = undefined,
    source: Model<OSMA, OSCA> | undefined = undefined
  ): boolean | null {
    const targetConditionMet = this.conditionMet(
      target,
      this.conditions.target
    );
    const sourceConditionMet = this.conditionMet(
      source,
      this.conditions.source
    );
    const subjectConditionMet = this.conditionMet(
      subject,
      this.conditions.subject
    );

    const allConditionsMet =
      subjectConditionMet && targetConditionMet && sourceConditionMet;

    return allConditionsMet ? this.allow : null;
  }
}
