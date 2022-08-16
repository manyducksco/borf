export function makeComponent(...args) {
  let fn;

  if (args.length === 2) {
    // (app, fn): ignore app which is only for the purpose of inferring service types
    fn = args[1];
  } else {
    // (fn)
    fn = args[0];
  }

  return fn;
}
