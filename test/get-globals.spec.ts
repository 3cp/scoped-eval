import {test} from 'zora';
import parse from '../src/parse';
import * as ESTree from 'estree';
import _getGlobals from '../src/get-globals';

function getGlobals(ast: ESTree.Node, allowedGlobals: {[key: string]: boolean}): {[key: string]: [number, number][]} {
  return Object.assign({}, _getGlobals(ast, allowedGlobals));
}

test('getGlobals return global variables range', t => {
  t.deepEqual(getGlobals(parse('a'), {}), {
    a: [
      [0, 1]
    ]
  });
  t.deepEqual(getGlobals(parse('a=a*b'), {}), {
    a: [
      [0, 1],
      [2, 3],
    ],
    b: [
      [4, 5]
    ]
  });
});

test('getGlobals excludes allowed globals', t => {
  t.deepEqual(getGlobals(parse('a=undefined'), {}), {
    a: [
      [0, 1]
    ],
    'undefined': [
      [2, 11]
    ]
  });
  t.deepEqual(getGlobals(parse('a=undefined'), {'undefined': true}), {
    a: [
      [0, 1]
    ]
  });
});

test('getGlobals only extracts global variables', t => {
  const code = `if (typeof foo === 'number') { return Math.floor(foo / 7); }`;
  t.deepEqual(getGlobals(parse(code), {'Math': true}), {
    foo: [
      [11, 14],
      [49, 52]
    ]
  });
});

test('getGlobals skips local variables', t => {
  const code = `let b=a+1;b;`;
  t.deepEqual(getGlobals(parse(code), {}), {
    a: [
      [6, 7]
    ]
  });
});

test('getGlobals skips local variables defined with const', t => {
  const code = `const b=a+1;b;`;
  t.deepEqual(getGlobals(parse(code), {}), {
    a: [
      [8, 9]
    ]
  });
});

test('getGlobals skips local variables defined with var', t => {
  const code = `var b=a+1;b;`;
  t.deepEqual(getGlobals(parse(code), {}), {
    a: [
      [6, 7]
    ]
  });
});

test('getGlobals skips inner function scope', t => {
  const code = `a.map(i => '#'+i).join(',')`;
  t.deepEqual(getGlobals(parse(code), {}), {
    a: [
      [0, 1]
    ]
  });
});

test('getGlobals skips function definition', t => {
  const code = 'function a() { return b } a()';
  t.deepEqual(getGlobals(parse(code), {}), {
    b: [
      [22, 23]
    ]
  });
});

test('getGlobals reads deconstruct', t => {
  const code = `let {a = b, c} = d; a + c`;
  t.deepEqual(getGlobals(parse(code), {}), {
    b: [
      [9, 10]
    ],
    d: [
      [17, 18]
    ]
  });
});
