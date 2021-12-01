export class Service {
  app;
  http;

  cancellers = []; // just for compatibility with state(context, fn) calls like Component (Not really needed because services are singletons)

  created() {}
}
