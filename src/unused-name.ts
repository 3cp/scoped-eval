import * as ESTree from 'estree';
import { traverse } from 'estraverse';

const chars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '$', '_'];

export default function(ast: ESTree.Node): string {
  const vars: { [key: string]: boolean } = {};
  // All global, local variables
  traverse(ast, {
    enter: function(node: ESTree.Node): void {
      if (node.type === 'Identifier' && node.name.length === 1) {
        vars[node.name] = true;
      }
    }
  });

  for (const c of chars) {
    if (!vars[c]) return c;
  }

  throw new Error('I gave up :( You exhausted variable names a,b,...z,$,_ in one expression.');
}
