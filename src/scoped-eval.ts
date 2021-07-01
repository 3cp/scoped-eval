import modify, { ModifyCodeResult } from 'modify-code';
import * as ESTree from 'estree';
import { traverse } from 'estraverse';
import parse from './parse';
import getGlobals from './get-globals';

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
  'Intl': true,
  'fetch': true,
  'location': true,
  'setTimeout': true,
  'clearTimeout': true,
  'setInterval': true,
  'clearInterval': true,
  'setImmediate': true,
  'clearImmediate': true,
  // 'Selection': true,
  // 'TextDecoder': true,
  // 'TextEncoder': true,
  // 'Uint8Array': true,
  // 'Int8Array': true,
  // 'Uint16Array': true,
  // 'Int16Array': true,
  // 'Int32Array': true,
  // 'document': true,
  // 'history': true,
  // 'crypto': true,
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

  build(code: string): () => any {
    const codeResult = this.preprocess(code);
    return new Function(codeResult.code) as () => any;
  }

  preprocess(code: string): ModifyCodeResult {
    const ast = parse(code);
    const globals = getGlobals(ast, this.allowedGlobals);

    const m = modify(code);

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
          throw new Error('Dynamic import is not allowed');
        }
      }
    });

    // Replace foo with this.foo
    for (const name in globals) {
      for (const [start, end] of globals[name]) {
        m.replace(start, end, `this.${name}`);
      }
    }

    const result = m.transform();
    // TODO support result.map for debugging
    return result;
  }
}
