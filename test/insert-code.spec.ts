import {test} from 'zora';
import InsertCode from '../src/insert-code';

test('InsertCode inserts', t => {
  const m = new InsertCode("foo bar foo");
  m.insert(0, "this.");
  m.insert(8, "return ");
  m.insert(8, "this.");
  m.insert(4, "this.");

  t.is(m.transform(), "this.foo this.bar return this.foo");
});

test('InsertCode inserts case 2', t => {
  const m = new InsertCode("a <<= a | b");
  m.insert(0, "return ");
  m.insert(0, "this.");
  m.insert(6, "this.");
  m.insert(10, "this.");

  t.is(m.transform(), "return this.a <<= this.a | this.b");
});
