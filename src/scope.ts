const hasOwnProperty = Object.prototype.hasOwnProperty;

export enum AssignmentOperator {
  Assign                  = '=',
  ShiftLeftAssign         = '<<=',
  ShiftRightAssign        = '>>=',
  LogicalShiftRightAssign = '>>>=',
  ExponentiateAssign      = '**=',
  AddAssign               = '+=',
  SubtractAssign          = '-=',
  MultiplyAssign          = '*=',
  DivideAssign            = '/=',
  ModuloAssign            = '%=',
  BitwiseXorAssign        = '^=',
  BitwiseOrAssign         = '|=',
  BitwiseAndAssign        = '&=',
  LogicalOrAssign         = '||=',
  LogicalAndAssign        = '&&=',
  CoalesceAssign          = '??='
}

function assign(object: any, key: string, value: any, operator: AssignmentOperator) {
  switch (operator) {
    case AssignmentOperator.Assign:
      return object[key] = value;
    case AssignmentOperator.ShiftLeftAssign:
      return object[key] <<= value;
    case AssignmentOperator.ShiftRightAssign:
      return object[key] >>= value;
    case AssignmentOperator.LogicalShiftRightAssign:
      return object[key] >>>= value;
    case AssignmentOperator.ExponentiateAssign:
      return object[key] **= value;
    case AssignmentOperator.AddAssign:
      return object[key] += value;
    case AssignmentOperator.SubtractAssign:
      return object[key] -= value;
    case AssignmentOperator.MultiplyAssign:
      return object[key] *= value;
    case AssignmentOperator.DivideAssign:
      return object[key] /= value;
    case AssignmentOperator.ModuloAssign:
      return object[key] %= value;
    case AssignmentOperator.BitwiseXorAssign:
      return object[key] ^= value;
    case AssignmentOperator.BitwiseOrAssign:
      return object[key] |= value;
    case AssignmentOperator.BitwiseAndAssign:
      return object[key] &= value;
    case AssignmentOperator.LogicalOrAssign:
      return object[key] || (object[key] = value);
    case AssignmentOperator.LogicalAndAssign:
      return object[key] && (object[key] = value);
    case AssignmentOperator.CoalesceAssign:
      return object[key] ?? (object[key] = value);
  }
}

export default class Scope {
  constructor(
    private $this: any,
    private $parent?: Scope,
    private $context?: {[key: string]: any}) {}

  get(name: string): any {
    if (name === '$this' || name === '$parent' || name === '$context') {
      return this[name];
    }

    // Check contextual variables including $this and $parent
    if (this.$context && hasOwnProperty.call(this.$context, name)) {
      return this.$context[name];
    }
    // Check current binding context
    const type = typeof this.$this;
    if (type === 'function' || (type === 'object' && this.$this !== null)) {
      if (name in this.$this) {
        return this.$this[name];
      }
    }

    // Check parent binding context
    if (this.$parent) {
      return this.$parent.get(name);
    }
  }

  set(key: string, value: any, operator = AssignmentOperator.Assign): any {
    if (key.startsWith('$')) {
      throw new Error(`Cannot assign to the readonly ${key}.`);
    }

    if (Object.prototype.hasOwnProperty.call(this.$this, key)) {
      return assign(this.$this, key, value, operator);
    }

    if (this.$parent) {
      return this.$parent.set(key, value, operator);
    } else {
      throw new Error(`Cannot assign to unknown property "${key}".`);
    }
  }

  // TODO support adding contextual variable on the fly
  // <let :fullname="firstname + ' ' + lastname"></let>
  // <let fullname.bind="firstname + ' ' + lastname"></let>
  // <let fullname.one-time="firstname + ' ' + lastname"></let>
  // Reactive binding should become a getter, the function body is
  // produced by the parser, bind to current scope.
  //
  // addContextVariable(key: string, getterFunc or a value)
}
