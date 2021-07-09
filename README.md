# scoped-eval [![Node.js CI](https://github.com/3cp/scoped-eval/actions/workflows/node.js.yml/badge.svg)](https://github.com/3cp/scoped-eval/actions/workflows/node.js.yml)

Safely eval a JavaScript expression or statements within a scope.

## Import scoped-eval
```
npm install scoped-eval
```
```js
import ScopedEval from "scoped-eval";
// Or in CommonJS:
// const ScopedEval = require("scoped-eval").default;
```

## Usage

```js
const scopedEval = new ScopedEval();
const result = scopedEval.eval("Math.max(a, b)", {a: 1, b: 2});
console.log(result); // 2
```

The API surface is small:
```ts
export default class ScopedEval {
  allowedGlobals: {
    [key: string]: boolean;
  };
  allowGlobals(globals: string | string[]): void;
  eval(code: string, scope: any, stringInterpolationMode?: boolean): any;
  build(code: string, stringInterpolationMode?: boolean): () => any;
  preprocess(code: string, stringInterpolationMode?: boolean): string;
}
```

> It is designed as a class, so the allowed globals can be customised.

The `eval()` method takes two arguments, the first one is the code string to be evaluated, the second one is a scope which can be any kind of object (but not primitive values such as string and number). The code evaluation is sandboxed to only access the scope object, plus a list of allowed globals such as `Math` and `JSON`.

There are two lower level APIs,
1. `build(code)`: builds the code into a function, without executing it.
2. `preprocess(code)`: preprocess the code into a function body suitable for creating the function. More on this details later.

The implementation of `eval` and `build` explains better.
```ts
eval(code: string, scope: any, stringInterpolationMode = false): any {
  return this.build(code, stringInterpolationMode).call(scope);
}

build(code: string, stringInterpolationMode = false): () => any {
  return new Function(this.preprocess(code, stringInterpolationMode)) as () => any;
}
```

Previous example can be written in two lines with `build()`:
```js
const func = scopedEval.build("Math.max(a, b)");
const result = func.call({a: 1, b: 2});
```

> The difference is that the func built from `build()` can be reused to call against various scope objects. While `eval()` is designed to be used only once.

> The `preprocess` API is exposed for tool to pre-compile string expression (or even multiple statements).

## String interpolation mode

`scope-eval` supports string interpolation mode, it treats the code string as if it's wrapped in backticks.

`preprocess`, `build` and `eval` methods all support additional optional parameter to turn on string interpolation mode.

```js
scopedEval.eval("b + c", {}, true); // literally returns string "b + c"
scopedEval.eval("`b + c`"); // Same as above
scopedEval.eval("a is ${a}", {a:1}, true); // "a is 1"
scopedEval.eval("`a is ${a}`", {a: 1}); // Same as above
```

Because there is no backtick wrapper, you don't have to escape backtick in the string.
```js
scopedEval.eval("`a is ${a}", {a: 1}, true); // "`a is 1"
// Note has to write \\ for single \ because it's in a JS string "...".
scopedEval.eval("`\\`a is ${a}`", {a: 1}); // Same as above
```

If you need to literally write `${` in string. use `\${`.
```js
scopedEval.eval("\\${a}", {a:1}, true); // "${a}"
```

> Note scoped-eval's string interpolation is not real string interpolation, for simplicity, there is an edge case with different behaviour:
```js
scopedEval.eval("\\\\${1}", {}, true); // "\\${1}" ( means \${1} )
scopedEval.eval("`\\\\${1}`", {}); // "\\1" ( means \1 )
```

## How preprocess works

Take the previous example expression `"Math.max(a, b)"`.
1. It detects three global references: `Math`, `a`, and `b`.
2. It ignores the allowed globals, `Math` in this case.
3. Then rewrites the rest to `this.a` and `this.b`.
4. Add a `return ` on the last statement, the only statement in this case.
```js
const processedCode = scopedEval.preprocess("Math.max(a, b)");
console.log(processedCode);
// return Math.max(this.a, this.b)
```

So the built function will be:
```js
function() { return Math.max(this.a, this.b) }
```

That's how the `func.call({a:1, b:2})` works, not very complicated.

## Default allowed globals

`undefined`, `NaN`, `isNaN`, `Infinity`, `isFinite`, `alert`, `atob`, `btoa`,
`encodeURI`, `encodeURIComponent`, `decodeURI`, `decodeURIComponent`, `parseFloat`,
`parseInt`, `JSON`, `Number`, `String`, `Array`, `BigInt`, `Blob`, `Boolean`,
`Date`, `Map`, `Math`, `Object`, `RegExp`, `Set`, `Intl`.

## Add allowed globals

If you want to expose more globals:
```js
const scopedEval = new ScopedEval();
scopedEval.allowGlobals(["clearTimeout", "setTimeout"]);
// Can use just a string if adding only one global
scopedEval.allowGlobals("setTimeout");
// Any followed eval/build/preprocess will respect the added globals.
```

## More details on preprocess

Behind the scene, `preprocess` does following:
1. uses a full JS parser ([meriyah](https://github.com/meriyah/meriyah)) to parse the code into ESTree AST.
2. does a full variable scope analysis ([eslint-scope](https://github.com/eslint/eslint-scope)) to find out the global references.
3. rewrite the code string.

The final built func is a native JavaScript function, there is no need of `scoped-eval` package to run the built function. This design means you can use `scoped-eval`'s preprocess as a build tool to compile some expression or template.

This idea is very similar to how Vue2 and Vue3 compiles render template. Vue also rewrites the render template into a function with a list of allowed globals. While Vue2 has different setup between runtime compiler and build-time compiler, Vue3 normalised them into one compiler with an inner implementation of JavaScript expression parser.

`scoped-eval` reuses [meriyah](https://github.com/meriyah/meriyah) and [eslint-scope](https://github.com/eslint/eslint-scope), so the implementation is merely about 150 lines of code.

We think this kind of technique of safe-eval could be a nice standalone tool, hence `scoped-eval` was designed.

## Support of multiple statements

Other expression parsers (Angular, Aurelia, Vue) only support one single JavaScript expression, `scoped-eval` supports code (not just expression) with multiple statements.

When there is only one statement, and the statement is an expression, `scoped-eval` adds `return`.
```js
scopedEval.preprocess("a");
// "return this.a"
scopedEval.build("a");
// function() {return this.a}
```

When there are multiple statements, `scoped-eval` adds `return` to the last statement if it's an expression;
```js
scopedEval.preprocess("let sum = a + b; `Sum ${sum}`");
// "let sum = this.a + this.b; return `Sum ${sum}`"
```
Note `scoped-eval` didn't rewrite `sum` into `this.sum` in the above example because it's a local variable.

You can also explicitly use `return` statement anywhere you want.
```js
scopedEval.preprocess(`if (passed) {
  return "Good";
}
return "bad";
`);
// 'if (this.passed) {\n  return "Good";\n}\nreturn "bad";\n'
```
Note you can use `if` statement, other expression parsers would not allow that.

With `scoped-eval`, you can write not just a JavaScript expression, but a full JavaScript function body with multiple statements. You can even define inner function inside the function body.

## Runtime consideration

There is no runtime dependencies for `scope-eval`, all required (mainly [meriyah](https://github.com/meriyah/meriyah) and [eslint-scope](https://github.com/eslint/eslint-scope)) are pre-bundled in dist file. The dist file size is about 200KB, not considered small.

Note `scope-eval` only rewrites the code to limit global references, it doesn't transpile the code to older version of JavaScript such as ES5. So the code itself needs to only use the supported JavaScript syntax in the browsers (or Nodejs) that you want to support.

Note `scoped-eval` doesn't handle caching of the preprocessed code. If you use `scoped-eval` at runtime, it's recommended to cache the built func against original code string.

`scoped-eval` is also designed along with [contextual-proxy](https://github.com/3cp/contextual-proxy). This two can be used together to deliver interesting dynamic behaviour: eval a code string against a contextual proxy object. For experienced Aurelia users, `scoped-eval` is equivalent to aurelia-binding's parser, `contextual-proxy` is equivalent to aurelia-binding's binding scope.

## Compare to Angular/Aurelia/Vue's expression parsers

`scoped-eval` is closer to Vue's expression parser in terms of technique.
* Vue3 has an inner implementation of AST to parse JavaScript expression.
* `scoped-eval` reused [meriyah](https://github.com/meriyah/meriyah) and [eslint-scope](https://github.com/eslint/eslint-scope) to reduce maintenance cost. The full JavaScript parser also enables `scoped-eval` to support multiple statements.

Both Aurelia and Angular's parsers are used both in compile time and runtime. The expression is not executed by JavaScript engine itself, but by the AST tree in their parsers. In short, Aurelia and Angular parsers re-implemented a subset of JavaScript expression syntax, not just parsing, but also executing. That's why not all JavaScript syntax is supported in Aurelia/Angular's expression.

> The above assertion might be wrong for Angular because I didn't use it much.

## License
MIT.
