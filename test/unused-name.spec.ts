import { expect, test } from "bun:test";
import parse from '../src/parse';
import unusedName from '../src/unused-name';

test('unusedName returns first unused name', () => {
  expect(unusedName(parse('foo'))).toBe('a');
  expect(unusedName(parse('let a = b + 1; d + a'))).toBe('c');

  let code = '';
  for (let n = 97; n <= 122; n++) {
    // a to z
    code += String.fromCharCode(n) + ';';
  }
  expect(unusedName(parse(code))).toBe('$');
  expect(unusedName(parse(code + '$;'))).toBe('_');
});

test('unusedName gave up if user exhausted a to z, $ and _', () => {
  let code = '';
  for (let n = 97; n <= 122; n++) {
    // a to z
    code += String.fromCharCode(n) + ';';
  }
  code += '$;_;';
  expect(() => unusedName(parse(code))).toThrow(/^I gave up/);
});
