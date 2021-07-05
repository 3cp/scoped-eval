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
  t.is(result, "return this.foo");
  const func = se.build('foo');
  t.is(func.call({}), undefined);
  t.is(func.call({foo: 'Foo'}), 'Foo');
});

test('ScopedEval preprocesses expression with allowed globals', t => {
  const se = new ScopedEval();
  const code = 'JSON.stringify(Object.keys(foo))';
  const result = se.preprocess(code);
  t.is(result, "return JSON.stringify(Object.keys(this.foo))");
  const func = se.build(code);
  t.is(func.call({foo: {a:1, b:2}}), '["a","b"]');
});

test('ScopedEval preprocesses expression with assignment', t => {
  const se = new ScopedEval();
  const code = 'a = true';
  const result = se.preprocess(code);
  t.is(result, "return this.a = true");
  const func = se.build(code);
  const obj = {a: false};
  t.is(func.call(obj), true);
  t.is(obj.a, true);
});

test('ScopedEval preprocesses expression with local assignment', t => {
  const se = new ScopedEval();
  const code = 'let a = b + 1; return c + a;';
  const result = se.preprocess(code);
  t.is(result, "let a = this.b + 1; return this.c + a;");
  const func = se.build(code);
  const obj = {a: 5, b: 1, c: 2};
  t.is(func.call(obj), 4);
  t.deepEqual(obj, {a: 5, b: 1, c: 2});
});

test('ScopedEval preprocesses expression with complex assignment', t => {
  const se = new ScopedEval();
  const code = 'a <<= a | b';
  const result = se.preprocess(code);
  t.is(result, "return this.a <<= this.a | this.b");

  const obj = { a: 2, b: 1 };
  t.is(se.eval(code, obj), 16);
  t.deepEqual(obj, { a: 16, b: 1 });
});

test('ScopedEval builds empty function for empty input', t => {
  const se = new ScopedEval();
  const result = se.preprocess("");
  t.is(result, "");
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

test('ScopedEval preprocesses expression with explicit this', t => {
  const se = new ScopedEval();
  const code = "return a + this.b.c";
  const result = se.preprocess(code);
  t.is(result, "return this.a + this.b.c");
  t.throws(() => se.eval(code, {a: 1}))
  t.is(se.eval(code, {a: 1, b: {c: 2}}), 3);
});
