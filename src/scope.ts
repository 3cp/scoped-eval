
export class Scope {
  constructor(private $this: any, private $parent?: Scope) {}

  get(name: string): any {
    // Check context variables including $this and $parent
    if (this.hasOwnProperty(name)) return this[name];
    // Check current binding context
    if (this.$this) {
      const type = typeof this.$this;
      if (type === 'function' || (type === 'object' && this.$this !== null)) {
        if (Object.prototype.hasOwnProperty.call(this.$this, name)) {
          return this.$this[name];
        }
      }
    }
    // Check parent binding context
    if (this.$parent) {
      return this.$parent.get(name);
    }
  }
}