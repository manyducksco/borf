export class Component {
  constructor(...args) {
    if (args.length === 2) {
      // (app, bootstrap): ignore app which is only for the purpose of inferring service types
      this.bootstrap = args[1];
    } else {
      // (bootstrap)
      this.bootstrap = args[0];
    }
  }
}
