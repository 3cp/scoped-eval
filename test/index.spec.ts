import { expect, test } from "bun:test";
import ScopedEval from '../src';

test('ScopedEval has allowedGlobals', () => {
  const se = new ScopedEval();
  expect(se.allowedGlobals['JSON']).toBe(true);
  expect(se.allowedGlobals['TextDecoder']).toBe(undefined);

  se.allowGlobals(['TextDecoder', 'Uint8Array']);
  expect(se.allowedGlobals['TextDecoder']).toBe(true);
  expect(se.allowedGlobals['Uint8Array']).toBe(true);
  expect(se.allowedGlobals['TextEncoder']).toBe(undefined);

  se.allowGlobals('TextEncoder');
  expect(se.allowedGlobals['TextEncoder']).toBe(true);
});

test('ScopedEval preprocesses expression', () => {
  const se = new ScopedEval();
  const result = se.preprocess('foo');
  expect(result).toEqual(["a", "return a.foo"]);
  const func = se.build('foo');
  expect(func({})).toBe(undefined);
  expect(func({foo: 'Foo'})).toBe('Foo');
});

test('ScopedEval preprocesses expression with explicit return', () => {
  const se = new ScopedEval();
  const result = se.preprocess('return foo');
  expect(result).toEqual(["a", "return a.foo"]);
  const func = se.build('foo');
  expect(func({})).toBe(undefined);
  expect(func({ foo: 'Foo' })).toBe('Foo');
});

test('ScopedEval preprocesses expression with explicit return, case 2', () => {
  const se = new ScopedEval();
  const code = 'if (a) { return foo; } bar;';
  const result = se.preprocess(code);
  expect(result).toEqual(["b", "if (b.a) { return b.foo; } return b.bar;"]);
  const func = se.build(code);
  expect(func({ foo: 'Foo', bar: 'Bar' })).toBe('Bar');
  expect(func({ foo: 'Foo', bar: 'Bar', a: true })).toBe('Foo');
});

test('ScopedEval preprocesses expression with allowed globals', () => {
  const se = new ScopedEval();
  const code = 'JSON.stringify(Object.keys(foo))';
  const result = se.preprocess(code);
  expect(result).toEqual(["a", "return JSON.stringify(Object.keys(a.foo))"]);
  const func = se.build(code);
  expect(func({foo: {a:1, b:2}})).toBe('["a","b"]');
});

test('ScopedEval preprocesses expression with assignment', () => {
  const se = new ScopedEval();
  const code = 'a = true';
  const result = se.preprocess(code);
  expect(result).toEqual(["b", "return b.a = true"]);
  const func = se.build(code);
  const obj = {a: false};
  expect(func(obj)).toBe(true);
  expect(obj.a).toBe(true);
});

test('ScopedEval preprocesses expression with local variable', () => {
  const se = new ScopedEval();
  const code = 'let a = b + 1; return c + a;';
  const result = se.preprocess(code);
  expect(result).toEqual(["d", "let a = d.b + 1; return d.c + a;"]);
  const func = se.build(code);
  const obj = {a: 5, b: 1, c: 2};
  expect(func(obj)).toBe(4);
  expect(obj).toEqual({a: 5, b: 1, c: 2});
});

test('ScopedEval preprocesses expression with complex assignment', () => {
  const se = new ScopedEval();
  const code = 'a <<= a | b';
  const result = se.preprocess(code);
  expect(result).toEqual(["c", "return c.a <<= c.a | c.b"]);

  const obj = { a: 2, b: 1 };
  expect(se.eval(code, obj)).toBe(16);
  expect(obj).toEqual({ a: 16, b: 1 });
});

test('ScopedEval builds empty function for empty input', () => {
  const se = new ScopedEval();
  const result = se.preprocess("");
  expect(result).toEqual(["a", ""]);
  expect(se.eval("", {})).toBe(undefined);
});

test('ScopedEval rejects esm import/exports', () => {
  const se = new ScopedEval();

  const code = "import a from './a'; return a;";
  expect(() => se.preprocess(code)).toThrow();

  const code2 = "const a = 1; exports default a;";
  expect(() => se.build(code2)).toThrow();
  expect(() => se.eval(code2, {})).toThrow();

  const code3 = "import('./a')";
  expect(() => se.preprocess(code3)).toThrow();
});

test('ScopedEval correctly ignores local variable in inner function', () => {
  const se = new ScopedEval();
  const code = "list.map(n => n.name).join()";
  const result = se.preprocess(code);
  expect(result).toEqual(["a", "return a.list.map(n => n.name).join()"]);
  expect(se.eval(code, {list: [{name: "A"}, {name: "B"}]})).toBe("A,B");
});

test('ScopeEval supports string interpolation mode', () => {
  const se = new ScopedEval();
  const code = "b + c";
  const result = se.preprocess(code, true);
  expect(result).toEqual(["a", 'return "b + c"']);
  expect(se.eval(code, {b: 1, c: 2}, true)).toBe("b + c");
});

test('ScopeEval supports string interpolation mode with interpolation', () => {
  const se = new ScopedEval();
  const code = "${\"a\"}${a + '}' + `${b + c}`}";
  const result = se.preprocess(code, true);
  expect(result).toEqual(["d", 'return "" + ("a") + (d.a + \'}\' + `${d.b + d.c}`)']);
  expect(se.eval(code, {a: 1, b: 2, c: 3 }, true)).toBe('a1}5');
});

test('ScopeEval supports string interpolation mode with interpolation, case 2', () => {
  const se = new ScopedEval();
  const code = "`a`${`b${c}`}`d`";
  const result = se.preprocess(code, true);
  expect(result).toEqual(["a", 'return "`a`" + (`b${a.c}`) + "`d`"']);
  expect(se.eval(code, { a: 1, b: 2, c: 3 }, true)).toBe('`a`b3`d`');
});

test('ScopeEval supports expression using RegExp', () => {
  const se = new ScopedEval();
  const code = "/\\d/.test(value)";
  const result = se.preprocess(code);
  expect(result).toEqual(["a", 'return /\\d/.test(a.value)']);
  expect(se.eval(code, { value: 'abc' })).toBe(false);
  expect(se.eval(code, { value: 'ab9c' })).toBe(true);
});

test('ScopeEval rejects non-string code', () => {
  const se = new ScopedEval();
  expect(() => se.preprocess(null as unknown as string)).toThrow('Code to be evaluated must be a string, but received object: null');
  expect(() => se.preprocess(1 as any)).toThrow('Code to be evaluated must be a string, but received number: 1');
  expect(() => se.preprocess(undefined as unknown as string)).toThrow('Code to be evaluated must be a string, but received undefined: undefined');
});

test('ScopeEval properly handles var definition', () => {
  const se = new ScopedEval();
  const code = 'var a = 1; a + b';
  const result = se.preprocess(code);
  expect(result).toEqual(["c", 'var a = 1; return a + c.b']);
  expect(se.eval(code, { b: 2 })).toBe(3);
});

test('ScopeEval properly handles function scope', () => {
  const se = new ScopedEval();
  const code = 'function a() {return b;} a()';
  const result = se.preprocess(code);
  expect(result).toEqual(["c", 'function a() {return c.b;} return a()']);
  expect(se.eval(code, { b: 2 })).toBe(2);
});
