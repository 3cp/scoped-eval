import modify from 'modify-code';
import unusedName from './unused-name';
import parse from './parse';
import getGlobals from './get-globals';

const DEFAULT_ALLOWED_GLOBALS = {
  'undefined': true,
  'NaN': true,
  'Infinity': true,
  'alert': true,
  'atob': true,
  'btoa': true,
  'encodeURI': true,
  'encodeURIComponent': true,
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
  'RegExp': true,
  'Set': true,
  'Selection': true,
  // 'TextDecoder': true,
  // 'TextEncoder': true,
  // 'document': true,
  // 'location': true,
  // 'history': true,
  // 'crypto': true,
  // 'setTimeout': true,
  // 'clearTimeout': true,
  // 'setInterval': true,
  // 'clearInterval': true,
  // 'setImmediate': true,
  // 'clearImmediate': true,
};

export class ScopedEval {
  allowedGlobals: {[key: string]: boolean} = {...DEFAULT_ALLOWED_GLOBALS};
  cache: {[key: string]: (scope: any) => any} = {};

  allowGlobals(globals: string[]) {
    if (globals) {
      for (let n of globals) {
        this.allowedGlobals[n] = true;
      }
    }
  }

  build(code: string) {
    if (typeof this.cache[code] === 'function') {
      return this.cache[code];
    }

    const ast = parse(code);
    const globals = getGlobals(ast, this.allowedGlobals);
    console.log('globals', globals);
    console.log('ast', JSON.stringify(ast, null, 2));
    const scopeVariable = unusedName(globals);

    const m = modify(code);

    // Make the last expression as the return value;
    const count = ast.body.length;
    if (count > 0) {
      const lastStatement = ast.body[count - 1];
      if (lastStatement.type === 'ExpressionStatement') {
        m.insert(lastStatement.range[0], 'return ');
      }
    }

    // TODO rewrite globals to scope.get('name')
    // TODO rewrite assignment to scope.set('name', value)

    const result = m.transform();
    console.log(result);
    // TODO support result.map for debugging
    const func = new Function(scopeVariable, result.code) as (scope: any) => any;
    this.cache[code] = func;
    return func;
  }
}

