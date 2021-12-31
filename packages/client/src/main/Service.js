export class Service {
  static get isService() {
    return true;
  }

  #getService;

  constructor(getService) {
    this.#getService = getService;
  }

  service(name) {
    return this.#getService(name);
  }

  _created() {}
}
