import * as ESTree from 'estree';
import { traverse } from 'estraverse';
import parse from './parse';
import getGlobals from './get-globals';
import InsertCode from './insert-code';
import stringInterpolation from './string-interpolation';
import unusedName from './unused-name';

const DEFAULT_ALLOWED_GLOBALS = {
  'undefined': true,
  'NaN': true,
  'isNaN': true,
  'Infinity': true,
  'isFinite': true,
  'alert': true,
  'atob': true,
  'btoa': true,
  'encodeURI': true,
  'encodeURIComponent': true,
  'decodeURI': true,
  'decodeURIComponent': true,
  'parseFloat': true,
  'parseInt': true,
  'JSON': true,
  'Number': true,
  'String': true,
  'Array': true,
  'BigInt': true,
  'Blob': true,
  'Boolean': true,
  'Date': true,
  'Map': true,
  'Math': true,
  'Object': true,
  'RegExp': true,
  'Set': true,
  'Intl': true
};

export default class ScopedEval {
  allowedGlobals: {[key: string]: boolean} = {...DEFAULT_ALLOWED_GLOBALS};

  allowGlobals(globals: string | string[]) {
    if (typeof globals === 'string') {
      globals = [globals];
    }
    for (const n of globals) {
      this.allowedGlobals[n] = true;
    }
  }

  eval(code: string, scope: any, stringInterpolationMode = false): any {
    return this.build(code, stringInterpolationMode)(scope);
  }

  build(code: string, stringInterpolationMode = false): (scope: any) => any {
    return new Function(...this.preprocess(code, stringInterpolationMode)) as (scope: any) => any;
  }

  preprocess(code: string, stringInterpolationMode = false): [string, string] {
    if (typeof code !== 'string') {
      throw new Error(`Code to be evaluated must be a string, but received ${typeof code}: ${JSON.stringify(code)}`);
    }

    code = stringInterpolationMode ? stringInterpolation(code) : code;
    const ast = parse(code);
    const scopeVariable = unusedName(ast);
    const scopePrefix = scopeVariable + '.';
    const globals = getGlobals(ast, this.allowedGlobals);

    const m = new InsertCode(code);

    // Make the last expression as the return value;
    const count = ast.body.length;
    if (count > 0) {
      const lastStatement = ast.body[count - 1];
      if (lastStatement.type === 'ExpressionStatement') {
        m.insert(lastStatement.range[0], 'return ');
      }
    }

    // Reject dynamic import.
    traverse(ast as ESTree.Node, {
      enter: function (node: ESTree.Node) {
        if (node.type === 'ImportExpression') {
          throw new Error(`[${node.loc!.start.line}:${node.loc!.start.column}]: Dynamic import is not allowed`);
        }
      }
    });

    // Replace foo with this.foo
    for (const name in globals) {
      for (const range of globals[name]) {
        m.insert(range[0], scopePrefix);
      }
    }

    return [scopeVariable, m.transform()];
  }
}
