import test from 'ava';
import ScopedEval from '../src/index';

test('ScopedEval has allowedGlobals', t => {
  const se = new ScopedEval();
  t.is(se.allowedGlobals['JSON'], true);
  t.is(se.allowedGlobals['setTimeout'], undefined);

  se.allowGlobals(['setTimeout']);
  t.is(se.allowedGlobals['setTimeout'], true);
  t.is(se.allowedGlobals['clearTimeout'], undefined);

  se.allowGlobals('clearTimeout');
  t.is(se.allowedGlobals['clearTimeout'], true);
});

test('ScopeEval preprocesses expression', t => {
  const se = new ScopedEval();
  const [scopeVariable, code] = se.preprocess('foo');
  t.is(scopeVariable, 'a');
  t.is(code, "return a.get('foo')");
});

test('ScopeEval preprocesses expression with allowed globals', t => {
  const se = new ScopedEval();
  const [scopeVariable, code] = se.preprocess('JSON.stringify(Object.keys(foo))');
  t.is(scopeVariable, 'a');
  t.is(code, "return JSON.stringify(Object.keys(a.get('foo')))");
});

test('ScopeEval preprocesses expression with assignment', t => {
  const se = new ScopedEval();
  const [scopeVariable, code] = se.preprocess('a = true');
  t.is(scopeVariable, 'b');
  t.is(code, "return b.set('a', true, '=')");
});

test('ScopeEval preprocesses expression with local assignment', t => {
  const se = new ScopedEval();
  const [scopeVariable, code] = se.preprocess('let a = b + 1; return c + a;');
  t.is(scopeVariable, 'd');
  t.is(code, "let a = d.get('b') + 1; return d.get('c') + a;");
});
