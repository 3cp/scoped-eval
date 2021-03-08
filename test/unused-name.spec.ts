import test from 'ava';
import unusedName from '../src/unused-name';

test('unusedName returns first unused name', t => {
  t.is(unusedName({}), 'a');
  t.is(unusedName({a:1, b:1, d:1}), 'c');

  const used = {};
  for (let n = 97; n <= 122; n++) {
    // a to z
    used[String.fromCharCode(n)] = 1
    // aa to az
    used['a' + String.fromCharCode(n)] = 1
  }
  t.is(unusedName(used), 'ba');
});

test('unusedName gave up if user exausted a to z and aa to zz', t => {
  const used = {};
  for (let n = 97; n <= 122; n++) {
    // a to z
    used[String.fromCharCode(n)] = 1
    for (let n1 = 97; n1 <= 122; n1++) {
      // aa to zz
      used[String.fromCharCode(n) + String.fromCharCode(n1)] = 1
    }
  }
  t.throws(() => unusedName(used), {message: /^I gave up/});
});
