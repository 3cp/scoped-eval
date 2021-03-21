import test from 'ava';
import Scope, { AssignmentOperator } from '../src/scope';

test('Scope has a binding', t => {
  const object = {a: 1, b: false};
  const s = new Scope(object);
  t.is(s.get('$this'), object);
  t.is(s.get('a'), 1);
  t.is(s.get('b'), false);
  t.is(s.get('c'), undefined);
  t.is(s.get('$parent'), undefined);
  t.is(s.get('$context'), undefined);
});

test('Scope has a binding and parent chain', t => {
  const parent = {a: 2, c: 3};
  const object = {a: 1, b: false};

  const s = new Scope(object, new Scope(parent));
  t.is(s.get('$this'), object);
  t.is(s.get('a'), 1);
  t.is(s.get('b'), false);
  t.is(s.get('c'), 3);

  t.is(s.get('$parent').get('a'), 2);
  t.is(s.get('$parent').get('b'), undefined);
  t.is(s.get('$parent').get('c'), 3);
  t.is(s.get('$parent').get('$parent'), undefined);
});

test('Scope has contextual variables', t => {
  const proto = {a: 1};
  const object = Object.create(proto);
  object.b = false;
  const contextual = {$index: 3, $length: 5, b: "override"};
  const s = new Scope(object, undefined, contextual);
  t.is(s.get('$this'), object);
  t.is(s.get('$context'), contextual);
  t.is(s.get('a'), 1);
  t.is(s.get('b'), "override");
  t.is(s.get('$this').b, false);
  t.is(s.get('$context').b, "override");
  t.is(s.get('c'), undefined);
  t.is(s.get('$index'), 3);
  t.is(s.get('$length'), 5);
});

test('Scope can assign value to binding', t => {
  const object = {a: 1, b: false};
  const s = new Scope(object);
  t.is(s.set('a', 2), 2);
  t.is(s.set('b', true), true);
  t.deepEqual(object, {a: 2, b: true});
  t.throws(() => s.set('c', 1));
  t.throws(() => s.set('$this', 1));
  t.throws(() => s.set('$parent', 1));
  t.throws(() => s.set('$foo', 1));
});

test('Scope can assign value to parent binding', t => {
  const grandParent = {c: "c"};
  const parent = {b: false};
  const object = {a: 1};
  const gp = new Scope(grandParent);
  const p = new Scope(parent, gp);
  const s = new Scope(object, p);
  t.is(s.set('a', 2), 2);
  t.is(s.set('b', true), true);
  t.is(s.set('c', 'C'), 'C');
  t.throws(() => s.set('d', 1));
  t.throws(() => s.set('$this', 1));
  t.throws(() => s.set('$parent', 1));
  t.throws(() => s.set('$foo', 1));
  t.deepEqual(grandParent, {c: 'C'});
  t.deepEqual(parent, {b: true});
  t.deepEqual(object, {a: 2});
});

test('Scope can do various assignments', t => {
  const object = {a: 1};
  const s = new Scope(object);
  s.set('a', 2, AssignmentOperator.AddAssign);
  t.is(object.a, 3);
  s.set('a', 1, AssignmentOperator.SubtractAssign);
  t.is(object.a, 2);
  s.set('a', 3, AssignmentOperator.MultiplyAssign);
  t.is(object.a, 6);
  s.set('a', 2, AssignmentOperator.DivideAssign);
  t.is(object.a, 3);
  s.set('a', 2, AssignmentOperator.ModuloAssign);
  t.is(object.a, 1);

  s.set('a', 3, AssignmentOperator.ShiftLeftAssign);
  t.is(object.a, 8);
  s.set('a', 1, AssignmentOperator.ShiftRightAssign);
  t.is(object.a, 4);
  s.set('a', 1, AssignmentOperator.LogicalShiftRightAssign);
  t.is(object.a, 2);
  s.set('a', 3, AssignmentOperator.ExponentiateAssign);
  t.is(object.a, 8);

  s.set('a', 12, AssignmentOperator.BitwiseXorAssign);
  t.is(object.a, 4);
  s.set('a', 3, AssignmentOperator.BitwiseOrAssign);
  t.is(object.a, 7);
  s.set('a', 16 + 6, AssignmentOperator.BitwiseAndAssign);
  t.is(object.a, 6);
});

test('Scope can do various logical assignments', t => {
  const object = {a: false};
  const s = new Scope(object);
  s.set('a', true, AssignmentOperator.LogicalOrAssign);
  t.is(object.a, true);
  s.set('a', false, AssignmentOperator.LogicalAndAssign);
  t.is(object.a, false);

});

test('Scope can do CoalesceAssign', t => {
  const object = {a: 1};
  const s = new Scope(object);
  s.set('a', 2, AssignmentOperator.CoalesceAssign);
  t.is(object.a, 1);

  const object2 = {a: null};
  const s2 = new Scope(object2);
  const r = s2.set('a', true, AssignmentOperator.CoalesceAssign);
  t.is(object2.a, true);
});

test('Scope can bind promitives', t => {
  const s = new Scope(undefined);
  t.is(s.get('a'), undefined);
  t.is(s.get('$this'), undefined);

  const s1 = new Scope(null);
  t.is(s1.get('a'), undefined);
  t.is(s1.get('$this'), null);

  const s2 = new Scope(true);
  t.is(s2.get('a'), undefined);
  t.is(s2.get('$this'), true);

  const s3 = new Scope(NaN);
  t.is(s3.get('a'), undefined);
  t.is(s3.get('$this'), NaN);

  const s4 = new Scope("foo");
  t.is(s4.get('a'), undefined);
  t.is(s4.get('$this'), "foo");

  const s5 = new Scope(7);
  t.is(s5.get('a'), undefined);
  t.is(s5.get('$this'), 7);
});
