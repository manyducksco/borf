export function makeRouter() {
  const _routes = [];
  const _middlewares = [];

  function addRoute(method, url, handlers) {
    _routes.push({ method, url, handlers });
    return router;
  }

  const router = {
    _routes,
    _middlewares,

    use(middleware) {
      _middlewares.push(middleware);
      return this;
    },

    mount(...args) {
      let prefix = "";

      if (typeof args[0] === "string") {
        prefix = args.shift();
      }

      const router = args[0];
      for (const route of router._routes) {
        addRoute(route.method, `${prefix}/${route.url}`, router._middlewares.concat(route.handlers));
      }

      return this;
    },

    get(url, ...handlers) {
      return addRoute("GET", url, handlers);
    },
    post(url, ...handlers) {
      return addRoute("POST", url, handlers);
    },
    put(url, ...handlers) {
      return addRoute("PUT", url, handlers);
    },
    patch(url, ...handlers) {
      return addRoute("PATCH", url, handlers);
    },
    delete(url, ...handlers) {
      return addRoute("DELETE", url, handlers);
    },
    head(url, ...handlers) {
      return addRoute("HEAD", url, handlers);
    },
  };

  return router;
}
