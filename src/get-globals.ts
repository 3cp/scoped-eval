import {analyze, Reference} from 'eslint-scope';
import * as ESTree from 'estree';

export default function (ast: ESTree.Node, allowedGlobals: {[key: string]: boolean}): {[key: string]: [number, number][]} {
  const scopeManager = analyze(ast, {ecmaVersion: 6});
  const globalScope = scopeManager.acquire(ast);

  // If you do `const globals = {};`, globals actually has some properties inherited
  // like __defineSetter__, which makes globals['__defineSetter__'] not empty.
  const globals = Object.create(null);

  const localDefined = new Set(globalScope.set.keys());

  globalScope.through.forEach(function (ref: Reference) {
    const name = ref.identifier.name;
    if (localDefined.has(name)) return;

    if (allowedGlobals[name] === true) return;
    // TODO: warn user about usage of not by default allowed global?
    // show user how to allow extra globals.

    const range = ref.identifier.range!;

    if (globals[name]) {
      globals[name].push(range);
    } else {
      globals[name] = [range];
    }
  });

  return globals;
}