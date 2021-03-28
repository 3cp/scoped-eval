import {parseScript, Options} from 'meriyah';
import * as ESTree from 'estree';

const paserOptions: Options = {
  next: true,
  ranges: true,
  webcompat: true,
  globalReturn: true,
  impliedStrict: true
};

export default function (code: string): ESTree.Program {
  return parseScript(code, paserOptions) as ESTree.Program;
}
