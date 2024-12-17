import { expect, test } from "bun:test";
import InsertCode from '../src/insert-code';

test('InsertCode inserts', () => {
  const m = new InsertCode("foo bar foo");
  m.insert(0, "this.");
  m.insert(8, "return ");
  m.insert(8, "this.");
  m.insert(4, "this.");

  expect(m.transform()).toBe("this.foo this.bar return this.foo");
});

test('InsertCode inserts case 2', () => {
  const m = new InsertCode("a <<= a | b");
  m.insert(0, "return ");
  m.insert(0, "this.");
  m.insert(6, "this.");
  m.insert(10, "this.");

  expect(m.transform()).toBe("return this.a <<= this.a | this.b");
});
