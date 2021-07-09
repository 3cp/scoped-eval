import test from 'ava';
import stringInterpolation from '../src/string-interpolation';

test('stringInterpolation translates single string part', t => {
  t.is(stringInterpolation("a"), '"a"');
  t.is(stringInterpolation("b + c"), '"b + c"');
  t.is(stringInterpolation("\"a\""), '"\\"a\\""');
  t.is(stringInterpolation("`'"), '"`\'"');
  t.is(stringInterpolation("a\\$b"), '"a\\\\$b"');
  // \${ means ${
  t.is(stringInterpolation("\\${a"), '"${a"');
  t.is(stringInterpolation("b\\${a"), '"b${a"');
  t.is(stringInterpolation("b\\${"), '"b${"');
  // Edge case: \\${ becomes \${,
  // In real string interpolation, \\${ means single \
  // followed by opening interpolation
  t.is(stringInterpolation("b\\\\${a"), '"b\\\\${a"');
});

test('stringInterpolation translates interpolation', t => {
  t.is(stringInterpolation("${a}"), '"" + (a)');
  t.is(stringInterpolation("a ${b + c}"), '"a " + (b + c)');
  t.is(stringInterpolation("${\"a\"}${a + '}' + `${b + c}`}"), '"" + ("a") + (a + \'}\' + `${b + c}`)');
  t.is(stringInterpolation("`a`${`b${c}`}`d`"), '"`a`" + (`b${c}`) + "`d`"');
});

test('stringInterpolation rejects malformed interpolation', t => {
  t.throws(() => stringInterpolation("${"));
  t.throws(() => stringInterpolation("${}"));
  t.throws(() => stringInterpolation("a ${b + '}'"));
});
