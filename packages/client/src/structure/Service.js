export class Service {
  app;
  http;

  cancellers = []; // For compatibility with state(this, fn) calls. Not really needed because services are singletons.

  created() {}
}
