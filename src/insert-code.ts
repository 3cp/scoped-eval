export default class InsertCode {
  parts: { [key: number]: string[]};

  constructor(private code: string) {
    this.parts = {};
  }

  insert(at: number, addition: string) {
    let additions: string[];
    if (this.parts[at]) {
      additions = this.parts[at];
    } else {
      additions = [];
      this.parts[at] = additions;
    }
    additions.push(addition);
  }

  transform() {
    const positions = Object.keys(this.parts).map(x => parseInt(x, 10)).sort((a, b) => a - b);

    let result = "";
    let lastPosition = 0;
    for (const position of positions) {
      result += this.code.slice(lastPosition, position);
      for (const addition of this.parts[position]) {
        result += addition;
      }
      lastPosition = position;
    }
    result += this.code.slice(lastPosition);
    return result;
  }
}
