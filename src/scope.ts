const PARENT = "$parent";
const PARENTS = "$parents";
const THIS = "$this";

function handler(context: { [key: string]: any }, parent: any): ProxyHandler<any> {
  return {
    get(target: any, key: string) {
      if (key === PARENT) return parent;
      if (key === PARENTS) {
        if (parent) return [parent, ...parent.$parents];
        return [];
      }
      // $this means the wrapped target, not current proxy.
      if (key === THIS) return target;
      if (Reflect.has(context, key)) return Reflect.get(context, key);
      if (Reflect.has(target, key)) return Reflect.get(target, key);
      if (parent) return parent[key];
    },
    has(target: any, key: string) {
      if (key === PARENT) return !!parent;
      if (key === PARENTS) return true;
      // $this means the wrapped target, not current proxy.
      if (key === THIS) return !!target;
      if (Reflect.has(context, key) || Reflect.has(target, key)) return true;
      if (parent) return key in parent;
      return false;
    },
    set(target: any, key: string, value: any) {
      // $parent, $parents and $this is not assignable.
      // return TypeError in strict mode
      if (key === PARENT || key === PARENTS || key === THIS) return false;
      if (Reflect.has(context, key)) return Reflect.set(context, key, value);
      if (Reflect.has(target, key)) return Reflect.set(target, key, value);
      if (parent && Reflect.set(parent, key, value)) return true;
      // If cannot assign to parent chain, create a local variable
      if (key.startsWith("$")) return Reflect.set(context, key, value);
      return Reflect.set(target, key, value);
    }
  };
}

// Proxy can not be extended, so we use a factory method.
// Scope is a proxy with access to parent Scope through $parent and $parents.
// There is also contextual variables like $foo and $index.
// By convention, all contextual variable names start with "$".
export default function makeScope(
  target: any,
  // parent must be a scope made from makeScope.
  parent: any = undefined,
  // contextual variables.
  context: { [key: string]: any } = Object.create(null),
): any {
  return new Proxy(target, handler(context, parent));
}
