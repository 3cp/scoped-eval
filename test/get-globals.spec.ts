import test from 'ava';
import parse from '../src/parse';
import getGlobals from '../src/get-globals';

test('getGlobals return global variables range', t => {
  t.deepEqual(getGlobals(parse('a'), {}), {
    a: [
      {start: 0, end: 1}
    ]
  });
  t.deepEqual(getGlobals(parse('a=a*b'), {}), {
    a: [
      {start: 0, end: 1},
      {start: 2, end: 3},
    ],
    b: [
      {start: 4, end: 5}
    ]
  });
});

test('getGlobals excludes allowed globals', t => {
  t.deepEqual(getGlobals(parse('a=undefined'), {}), {
    a: [
      {start: 0, end: 1}
    ],
    'undefined': [
      {start: 2, end: 11}
    ]
  });
  t.deepEqual(getGlobals(parse('a=undefined'), {'undefined': true}), {
    a: [
      {start: 0, end: 1}
    ]
  });
});

test('getGlobals only extracts global variables', t => {
  const code = `if (typeof foo === 'number') { return Math.floor(foo / 7); }`;
  t.deepEqual(getGlobals(parse(code), {'Math': true}), {
    foo: [
      {start: 11, end: 14},
      {start: 49, end: 52}
    ]
  });
});

test('getGlobals skips local variables', t => {
  const code = `let b=a+1;b;`;
  t.deepEqual(getGlobals(parse(code), {}), {
    a: [
      {start: 6, end: 7}
    ]
  });
});

test('getGlobals skips inner function scope', t => {
  const code = `a.map(i => '#'+i).join(',')`;
  t.deepEqual(getGlobals(parse(code), {}), {
    a: [
      {start: 0, end: 1}
    ]
  });
});
