import { expect, test } from "bun:test";
import parse from '../src/parse';
import * as ESTree from 'estree';
import _getGlobals from '../src/get-globals';

function getGlobals(ast: ESTree.Node, allowedGlobals: {[key: string]: boolean}): {[key: string]: [number, number][]} {
  return Object.assign({}, _getGlobals(ast, allowedGlobals));
}

test('getGlobals return global variables range', () => {
  expect(getGlobals(parse('a'), {})).toEqual({
    a: [
      [0, 1]
    ]
  });
  expect(getGlobals(parse('a=a*b'), {})).toEqual({
    a: [
      [0, 1],
      [2, 3],
    ],
    b: [
      [4, 5]
    ]
  });
});

test('getGlobals excludes allowed globals', () => {
  expect(getGlobals(parse('a=undefined'), {})).toEqual({
    a: [
      [0, 1]
    ],
    'undefined': [
      [2, 11]
    ]
  });
  expect(getGlobals(parse('a=undefined'), {'undefined': true})).toEqual({
    a: [
      [0, 1]
    ]
  });
});

test('getGlobals only extracts global variables', () => {
  const code = `if (typeof foo === 'number') { return Math.floor(foo / 7); }`;
  expect(getGlobals(parse(code), {'Math': true})).toEqual({
    foo: [
      [11, 14],
      [49, 52]
    ]
  });
});

test('getGlobals skips local variables', () => {
  const code = `let b=a+1;b;`;
  expect(getGlobals(parse(code), {})).toEqual({
    a: [
      [6, 7]
    ]
  });
});

test('getGlobals skips local variables defined with const', () => {
  const code = `const b=a+1;b;`;
  expect(getGlobals(parse(code), {})).toEqual({
    a: [
      [8, 9]
    ]
  });
});

test('getGlobals skips local variables defined with var', () => {
  const code = `var b=a+1;b;`;
  expect(getGlobals(parse(code), {})).toEqual({
    a: [
      [6, 7]
    ]
  });
});

test('getGlobals skips inner function scope', () => {
  const code = `a.map(i => '#'+i).join(',')`;
  expect(getGlobals(parse(code), {})).toEqual({
    a: [
      [0, 1]
    ]
  });
});

test('getGlobals skips function definition', () => {
  const code = 'function a() { return b } a()';
  expect(getGlobals(parse(code), {})).toEqual({
    b: [
      [22, 23]
    ]
  });
});

test('getGlobals reads deconstruct', () => {
  const code = `let {a = b, c} = d; a + c`;
  expect(getGlobals(parse(code), {})).toEqual({
    b: [
      [9, 10]
    ],
    d: [
      [17, 18]
    ]
  });
});
