import {analyze, Reference} from 'eslint-scope';
import * as ESTree from 'estree';

export default function (ast: ESTree.Node, allowedGlobals: {[key: string]: boolean}): {[key: string]: [number, number][]} {
  const scopeManager = analyze(ast, {ecmaVersion: 6});
  const globalScope = scopeManager.acquire(ast);

  // If you do `const globals = {};`, globals actually has some properties inherited
  // like __defineSetter__, which makes globals['__defineSetter__'] not empty.
  const globals = Object.create(null);

  globalScope.through.forEach(function (ref: Reference) {
    const name = ref.identifier.name;
    if (allowedGlobals[name] === true) return;

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const range = ref.identifier.range!;

    if (globals[name]) {
      globals[name].push(range);
    } else {
      globals[name] = [range];
    }
  });

  return globals;
}