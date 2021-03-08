import {analyze} from 'eslint-scope';
import {ESTree} from 'meriyah';

export default function (ast: ESTree.Program, allowedGlobals: {[key: string]: boolean}): {[key: string]: {start: number, end: number}[]} {
  const scopeManager = analyze(ast, {ecmaVersion: 6});
  const globalScope = scopeManager.acquire(ast);

  // If you do `const globals = {};`, globals actually has some properties inherited
  // like __defineSetter__, which makes globals['__defineSetter__'] not empty.
  const globals = Object.create(null);

  globalScope.through.forEach(function (ref) {
    const name = ref.identifier.name;
    if (allowedGlobals[name] === true) return;

    const start = ref.identifier['start'] as number;
    const end = ref.identifier['end'] as number;

    if (globals[name]) {
      globals[name].push({start, end});
    } else {
      globals[name] = [{start, end}];
    }
  });

  return globals;
}