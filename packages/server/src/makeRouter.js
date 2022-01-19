export function makeRouter() {
  const middleware = [];

  const router = {
    use(handler) {
      middleware.push(handler);
    },

    route(path, component) {},
    mount(...args) {}, // mount(path, router) or mount(router)

    get(path, ...handlers) {},
    post(path, ...handlers) {},
    put(path, ...handlers) {},
    patch(path, ...handlers) {},
    delete(path, ...handlers) {},
  };

  return router;
}
