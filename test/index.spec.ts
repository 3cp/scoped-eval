import test from 'ava';
import ScopedEval from '../src';

test('ScopedEval has allowedGlobals', t => {
  const se = new ScopedEval();
  t.is(se.allowedGlobals['JSON'], true);
  t.is(se.allowedGlobals['TextDecoder'], undefined);

  se.allowGlobals(['TextDecoder', 'Uint8Array']);
  t.is(se.allowedGlobals['TextDecoder'], true);
  t.is(se.allowedGlobals['Uint8Array'], true);
  t.is(se.allowedGlobals['TextEncoder'], undefined);

  se.allowGlobals('TextEncoder');
  t.is(se.allowedGlobals['TextEncoder'], true);
});

test('ScopedEval preprocesses expression', t => {
  const se = new ScopedEval();
  const result = se.preprocess('foo');
  t.deepEqual(result, ["a", "return a.foo"]);
  const func = se.build('foo');
  t.is(func({}), undefined);
  t.is(func({foo: 'Foo'}), 'Foo');
});

test('ScopedEval preprocesses expression with explicit return', t => {
  const se = new ScopedEval();
  const result = se.preprocess('return foo');
  t.deepEqual(result, ["a", "return a.foo"]);
  const func = se.build('foo');
  t.is(func({}), undefined);
  t.is(func({ foo: 'Foo' }), 'Foo');
});

test('ScopedEval preprocesses expression with explicit return, case 2', t => {
  const se = new ScopedEval();
  const code = 'if (a) { return foo; } bar;';
  const result = se.preprocess(code);
  t.deepEqual(result, ["b", "if (b.a) { return b.foo; } return b.bar;"]);
  const func = se.build(code);
  t.is(func({ foo: 'Foo', bar: 'Bar' }), 'Bar');
  t.is(func({ foo: 'Foo', bar: 'Bar', a: true }), 'Foo');
});

test('ScopedEval preprocesses expression with allowed globals', t => {
  const se = new ScopedEval();
  const code = 'JSON.stringify(Object.keys(foo))';
  const result = se.preprocess(code);
  t.deepEqual(result, ["a", "return JSON.stringify(Object.keys(a.foo))"]);
  const func = se.build(code);
  t.is(func({foo: {a:1, b:2}}), '["a","b"]');
});

test('ScopedEval preprocesses expression with assignment', t => {
  const se = new ScopedEval();
  const code = 'a = true';
  const result = se.preprocess(code);
  t.deepEqual(result, ["b", "return b.a = true"]);
  const func = se.build(code);
  const obj = {a: false};
  t.is(func(obj), true);
  t.is(obj.a, true);
});

test('ScopedEval preprocesses expression with local variable', t => {
  const se = new ScopedEval();
  const code = 'let a = b + 1; return c + a;';
  const result = se.preprocess(code);
  t.deepEqual(result, ["d", "let a = d.b + 1; return d.c + a;"]);
  const func = se.build(code);
  const obj = {a: 5, b: 1, c: 2};
  t.is(func(obj), 4);
  t.deepEqual(obj, {a: 5, b: 1, c: 2});
});

test('ScopedEval preprocesses expression with complex assignment', t => {
  const se = new ScopedEval();
  const code = 'a <<= a | b';
  const result = se.preprocess(code);
  t.deepEqual(result, ["c", "return c.a <<= c.a | c.b"]);

  const obj = { a: 2, b: 1 };
  t.is(se.eval(code, obj), 16);
  t.deepEqual(obj, { a: 16, b: 1 });
});

test('ScopedEval builds empty function for empty input', t => {
  const se = new ScopedEval();
  const result = se.preprocess("");
  t.deepEqual(result, ["a", ""]);
  t.is(se.eval("", {}), undefined);
});

test('ScopedEval rejects esm import/exports', t => {
  const se = new ScopedEval();

  const code = "import a from './a'; return a;";
  t.throws(() => se.preprocess(code));

  const code2 = "const a = 1; exports default a;";
  t.throws(() => se.build(code2));
  t.throws(() => se.eval(code2, {}));

  const code3 = "import('./a')";
  t.throws(() => se.preprocess(code3));
});

test('ScopedEval correctly ignores local variable in inner function', t => {
  const se = new ScopedEval();
  const code = "list.map(n => n.name).join()";
  const result = se.preprocess(code);
  t.deepEqual(result, ["a", "return a.list.map(n => n.name).join()"]);
  t.is(se.eval(code, {list: [{name: "A"}, {name: "B"}]}), "A,B");
});

test('ScopeEval supports string interpolation mode', t => {
  const se = new ScopedEval();
  const code = "b + c";
  const result = se.preprocess(code, true);
  t.deepEqual(result,["a", 'return "b + c"']);
  t.is(se.eval(code, {b: 1, c: 2}, true), "b + c");
});

test('ScopeEval supports string interpolation mode with interpolation', t => {
  const se = new ScopedEval();
  const code = "${\"a\"}${a + '}' + `${b + c}`}";
  const result = se.preprocess(code, true);
  t.deepEqual(result, ["d", 'return "" + ("a") + (d.a + \'}\' + `${d.b + d.c}`)']);
  t.is(se.eval(code, {a: 1, b: 2, c: 3 }, true), 'a1}5');
});

test('ScopeEval supports string interpolation mode with interpolation, case 2', t => {
  const se = new ScopedEval();
  const code = "`a`${`b${c}`}`d`";
  const result = se.preprocess(code, true);
  t.deepEqual(result, ["a", 'return "`a`" + (`b${a.c}`) + "`d`"']);
  t.is(se.eval(code, { a: 1, b: 2, c: 3 }, true), '`a`b3`d`');
});

test('ScopeEval supports expression using RegExp', t => {
  const se = new ScopedEval();
  const code = "/\\d/.test(value)";
  const result = se.preprocess(code);
  t.deepEqual(result, ["a", 'return /\\d/.test(a.value)']);
  t.is(se.eval(code, { value: 'abc' }), false);
  t.is(se.eval(code, { value: 'ab9c' }), true);
});

test('ScopeEval rejects non-string code', t => {
  const se = new ScopedEval();
  t.throws(() => se.preprocess(null), { message: 'Code to be evaluated must be a string, but received object: null'});
  t.throws(() => se.preprocess(1 as any), { message: 'Code to be evaluated must be a string, but received number: 1'});
  t.throws(() => se.preprocess(undefined), { message: 'Code to be evaluated must be a string, but received undefined: undefined'});
});

test('ScopeEval properly handles var definition', t => {
  const se = new ScopedEval();
  const code = 'var a = 1; a + b';
  const result = se.preprocess(code);
  t.deepEqual(result, ["c", 'var a = 1; return a + c.b']);
  t.is(se.eval(code, { b: 2 }), 3);
});

test('ScopeEval properly handles function scope', t => {
  const se = new ScopedEval();
  const code = 'function a() {return b;} a()';
  const result = se.preprocess(code);
  t.deepEqual(result, ["c", 'function a() {return c.b;} return a()']);
  t.is(se.eval(code, { b: 2 }), 2);
});
