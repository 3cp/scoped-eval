import { expect, test } from "bun:test";
import stringInterpolation from '../src/string-interpolation';

test('stringInterpolation translates single string part', () => {
  expect(stringInterpolation("a")).toBe('"a"');
  expect(stringInterpolation("b + c")).toBe('"b + c"');
  expect(stringInterpolation("\"a\"")).toBe('"\\"a\\""');
  expect(stringInterpolation("`'")).toBe('"`\'"');
  expect(stringInterpolation("a\\$b")).toBe('"a\\\\$b"');
  // \${ means ${
  expect(stringInterpolation("\\${a")).toBe('"${a"');
  expect(stringInterpolation("b\\${a")).toBe('"b${a"');
  expect(stringInterpolation("b\\${")).toBe('"b${"');
  // Edge case: \\${ becomes \${,
  // In real string interpolation, \\${ means single \
  // followed by opening interpolation
  expect(stringInterpolation("b\\\\${a")).toBe('"b\\\\${a"');
});

test('stringInterpolation translates interpolation', () => {
  expect(stringInterpolation("${a}")).toBe('"" + (a)');
  expect(stringInterpolation("a ${b + c}")).toBe('"a " + (b + c)');
  expect(stringInterpolation("${\"a\"}${a + '}' + `${b + c}`}")).toBe('"" + ("a") + (a + \'}\' + `${b + c}`)');
  expect(stringInterpolation("`a`${`b${c}`}`d`")).toBe('"`a`" + (`b${c}`) + "`d`"');
});

test('stringInterpolation rejects malformed interpolation', () => {
  expect(() => stringInterpolation("${")).toThrow();
  expect(() => stringInterpolation("${}")).toThrow();
  expect(() => stringInterpolation("a ${b + '}'")).toThrow();
});
