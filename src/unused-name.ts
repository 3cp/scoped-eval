const chars = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

export default function(globals: object) {
  for (let c of chars) {
    if (!globals[c]) return c;
  }
  for (let c0 of chars) {
    for (let c1 of chars) {
      const c = c0 + c1;
      if (!globals[c]) return c;
    }
  }
  throw new Error('I gave up :( You exausted variable names a,b,...z, and aa,ab,...zz in one expression.');
}
