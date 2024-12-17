// Handle bare string interpolation like:
// foo ${bar} lo
// without backticks ``
// Because it's not wrapped in backticks, it does not have to
// escape backtick.
// `foo` ${bar} lo
// means:
// `\`foo\` ${bar} lo`
import parse from './parse';

enum Type {
  str,
  exp
}

class Part {
  constructor(
    public t: Type,
    public v: string
  ) { }
}

function split(code: string): Part[] {
  const start = code.indexOf('${');
  if (start === -1) return [new Part(Type.str, code)];
  // \${
  if (start > 0 && code[start - 1] === '\\') {
    const parts: Part[] = [
      // \${ literally means ${
      new Part(Type.str, code.slice(0, start - 1) + '${')
    ];
    if (start + 2 < code.length) {
      parts.push(...split(code.slice(start + 2)));
    }
    return parts;
  }

  // Did not use start + 2 because of next line search from end + 1
  // end + 1 is position after { in first try, or position after }
  // in second or other tries.
  let end = start + 1;
  for (; ;) {
    end = code.indexOf('}', end + 1);
    if (end === -1) {
      throw new Error("cannot find } in interpolation: " + code.slice(start));
    }
    const interpolation = code.slice(start + 2, end);
    try {
      const ast = parse(interpolation);
      if (ast.body.length !== 1 || ast.body[0].type !== "ExpressionStatement") {
        // Reject non-expression
        throw new Error("not a valid expression: " + interpolation);
      }
    } catch {
      // Try next "}"
      continue;
    }

    const parts: Part[] = [];
    if (start > 0) {
      parts.push(new Part(Type.str, code.slice(0, start)));
    }
    parts.push(new Part(Type.exp, interpolation));
    if (end + 1 < code.length) {
      parts.push(...split(code.slice(end + 1)));
    }
    return parts;
  }
}

function clean(parts: Part[]): Part[] {
  const newParts: Part[] = [];
  let last: Part | undefined;
  for (const part of parts) {
    // Merge str parts
    if (last && last.t === Type.str && part.t === Type.str) {
      last.v += part.v;
      continue;
    }
    last = part;
    newParts.push(part);
  }
  return newParts;
}

// Transpile string interpolation to string concatenation.
// Cannot just wrap the whole string in `` and escape ` properly,
// Because this string interpolation behaves slight different than
// the real string interpolation, there are edge cases around \\${.
export default function stringInterpolation(stringInterpolation: string): string {
  const parts = clean(split(stringInterpolation));
  // Rewrite
  // `foo` ${bar} lo
  // to
  // "`foo` " + (bar) + " lo"
  return parts.map((part, i) => {
    if (part.t === Type.exp) {
      const wrapped = '(' + part.v + ')';
      // If first part is expression, use "" + (exp)
      if (i === 0) return '"" + ' + wrapped;
      return wrapped;
    }
    return JSON.stringify(part.v);
  }).join(' + ');
}
