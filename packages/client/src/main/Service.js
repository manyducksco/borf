export class Service {
  static get isService() {
    return true;
  }

  #getService;
  cancellers = []; // For compatibility with state(this, fn) calls. Not really needed because services are singletons.

  constructor(getService) {
    this.#getService = getService;
  }

  service(name) {
    return this.#getService(name);
  }

  _created() {}
}
