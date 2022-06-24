import {test} from 'zora';
import parse from '../src/parse';
import unusedName from '../src/unused-name';

test('unusedName returns first unused name', t => {
  t.is(unusedName(parse('foo')), 'a');
  t.is(unusedName(parse('let a = b + 1; d + a')), 'c');

  let code = '';
  for (let n = 97; n <= 122; n++) {
    // a to z
    code += String.fromCharCode(n) + ';';
  }
  t.is(unusedName(parse(code)), '$');
  t.is(unusedName(parse(code + '$;')), '_');
});

test('unusedName gave up if user exhausted a to z, $ and _', t => {
  let code = '';
  for (let n = 97; n <= 122; n++) {
    // a to z
    code += String.fromCharCode(n) + ';';
  }
  code += '$;_;';
  try {
    unusedName(parse(code));
    t.fail('should not pass');
  } catch (e) {
    t.ok(e.message.match(/^I gave up/));
  }
});
