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

`scoped-eval` is designed as a class, so the allowed globals can be customised, with following APIs:
```ts
export default class ScopedEval {
    allowedGlobals: {
        [key: string]: boolean;
    };
    allowGlobals(globals: string | string[]): void;
    eval(code: string, scope: any): any;
    build(code: string): () => any;
    preprocess(code: string): string;
}
```

The `eval()` method takes two arguments, the first one is the code string to be evaluated, the second one is a scope which can be any kind of object (but not primitive values such as string and number). The code evaluation is sandboxed to only access the scope object, plus a list of allowed globals such as `Math` and `JSON`.

There are two lower level APIs,
1. `build(code)`: builds the code into a function, without executing it.
2. `preprocess(code)`: preprocess the code into a function body suitable for creating the function. More on this details later.

The implementation of `eval` and `build` explains better.
```ts
eval(code: string, scope: any): any {
  return this.build(code).call(scope);
}

build(code: string): () => any {
  return new Function(this.preprocess(code)) as () => any;
}
```

Previous example can be written in two lines with `build()`:
```js
const func = scopedEval.build("Math.max(a, b)");
const result = func.call({a: 1, b: 2});
```

> The difference is that the func built from `build()` can be reused to call against various scope objects. While `eval()` is designed to be used only once.

> The `preprocess` API is exposed for tool to pre-compile string expression (or even multiple statements).

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
`Date`, `Map`, `Math`, `Object`, `RegExp`, `Set`, `Intl`

## Add allowed globals

If you want to expose more globals:
```js
const scopedEval = new ScopedEval();
scopedEval.allowGlobals(["clearTimeout", "setTimeout"]);
// Can use just a string if adding just one global
scopedEval.allowGlobals("setTimeout");
// Any followed eval/build/preprocess will respect the added globals.
```

## Support of multiple statements

## Origin of the idea

Vue, Aurelia. Check whether Angular does the same.
Runtime consideration.


## License
MIT.
