import test from 'ava';
import makeScope from '../src/scope';

test('Scope has a binding', t => {
  const object = {a: 1, b: undefined};
  const s = makeScope(object);
  t.is(s.a, 1);
  t.is('a' in s, true);
  t.is(s.b, undefined);
  t.is('b' in s, true);
  t.is(s.c, undefined);
  t.is('c' in s, false);
  t.is(s.$parent, undefined);
  t.is('$parent' in s, false);
  t.is('$this' in s, true);
  t.is(s.$parents.length, 0);
  t.is('$parents' in s, true);
});

test('Scope has a binding and parent chain', t => {
  const parent = {a: 2, c: 3};
  const object = {a: 1, b: false};

  const s = makeScope(object, makeScope(parent));
  t.is(s.a, 1);
  t.is(s.b, false);
  t.is(s.c, 3);
  t.is('c' in s, true);
  t.is(s.$this.a, 1);
  t.is(s.$this.c, undefined);
  t.is('$this' in s, true);
  t.is('$parent' in s, true);
  t.is(s.$parent.a, 2);
  t.is('a' in s.$parent, true);
  t.is(s.$parent.b, undefined);
  t.is('b' in s.$parent, false);
  t.is(s.$parent.c, 3);
  t.is('c' in s.$parent, true);
  t.is(s.$parent.$parent, undefined);
  t.is(s.$parents.length, 1);
  t.is('$parents' in s, true);
  t.is(s.$parent.$parents.length, 0);
});

test('Scope has contextual variables', t => {
  const proto = {a: 1};
  const object = Object.create(proto);
  object.b = false;
  const contextual = {$index: 3, $length: 5, b: "override"};
  const s = makeScope(object, null, contextual);
  t.is(s.a, 1);
  t.is(s.b, "override");
  t.is(s.$this.b, false);
  t.is(s.c, undefined);
  t.is(s.$index, 3);
  t.is(s.$length, 5);
});

test('Scope can assign value to binding', t => {
  const object = {a: 1, b: false};
  const s = makeScope(object);
  s.a = 2;
  t.is(s.a, 2);
  s.b = true;
  t.is(s.b, true);
  t.deepEqual(object, {a: 2, b: true});
  s.c = 1;
  t.is(s.c, 1);
  t.throws(() => s.$this = 1);
  t.throws(() => s.$parent = 1);
  s.$foo = 1;
  t.is(s.$foo, 1);
  t.is((object as any).$foo, undefined);
  t.deepEqual(object as any, { a: 2, b: true, c: 1 });
  t.is(s.$parents.length, 0);
});

test('Scope can assign value to existing contextual key', t => {
  const object = { a: 1, b: false };
  const s = makeScope(object, undefined, {b: true, $bar: 'bar'});
  t.is(s.b, true);
  t.is(s.$this.b, false);
  s.b = 2;
  t.is(s.b, 2);
  t.is(s.$this.b, false);
  t.deepEqual(object as any, { a: 1, b: false });
  t.is(s.$parents.length, 0);
});

test('Scope can assign value to parent binding', t => {
  const grandParent = {c: "c"};
  const parent = {b: false};
  const object = {a: 1};
  const gp = makeScope(grandParent);
  const p = makeScope(parent, gp);
  const s = makeScope(object, p);
  s.a = 2;
  t.is(s.a, 2);
  s.b = true;
  t.is(s.b, true);
  s.c = 'C';
  t.is(s.c, 'C');
  t.throws(() => s.$parent = 1);
  t.deepEqual(grandParent, {c: 'C'});
  t.deepEqual(parent, {b: true});
  t.deepEqual(object, {a: 2});
  t.is(s.$parent.c, 'C');
  t.is(s.$parent.$parent.c, 'C');
  t.is(s.$parent.a, undefined);
  t.is(s.$parents.length, 2);
  t.is(p.$parents.length, 1);
  t.is(gp.$parents.length, 0);
  t.is(s.$parents[1].b, undefined);
  t.is(s.$parents[1].c, 'C');
  t.is(s.$parents[0].b, true);
  t.is(s.$parents[0].c, 'C');
});

test('Scope can do various assignments', t => {
  const object = {a: 1};
  const s = makeScope(object);
  s.a += 2;
  t.is(object.a, 3);
  s.a -= 1;
  t.is(object.a, 2);
  s.a *= 3;
  t.is(object.a, 6);
  s.a /= 2;
  t.is(object.a, 3);
  s.a %= 2;
  t.is(object.a, 1);

  s.a <<= 3;
  t.is(object.a, 8);
  s.a >>= 1;
  t.is(object.a, 4);
  s.a >>>= 1;
  t.is(object.a, 2);
  s.a **= 3;
  t.is(object.a, 8);

  s.a ^= 12;
  t.is(object.a, 4);
  s.a |= 3;
  t.is(object.a, 7);
  s.a &= 16 + 6;
  t.is(object.a, 6);
});

test('Scope can do various logical assignments', t => {
  const object = {a: false};
  const s = makeScope(object);
  s.a ||= true;
  t.is(object.a, true);
  s.a &&= false;
  t.is(object.a, false);
});

test('Scope can do CoalesceAssign', t => {
  const object = {a: 1};
  const s = makeScope(object);
  s.a ??= 2;
  t.is(object.a, 1);

  const object2 = {a: null};
  const s2 = makeScope(object2);
  s2.a ??= true;
  t.is(object2.a, true);
});

test('Scope can not bind primitives', t => {
  t.throws(() => makeScope(undefined));
  t.throws(() => makeScope(null));
  t.throws(() => makeScope(true));
  t.throws(() => makeScope(NaN));
  t.throws(() => makeScope("foo"));
  t.throws(() => makeScope(7));
});
