export function makeRouter() {
  const _routes = [];

  function route(method, url, handlers) {
    _routes.push({ method, url, handlers });
    return router;
  }

  const router = {
    get: (url, ...handlers) => {
      return route("GET", url, handlers);
    },
    post: (url, ...handlers) => {
      return route("POST", url, handlers);
    },
    put: (url, ...handlers) => {
      return route("PUT", url, handlers);
    },
    patch: (url, ...handlers) => {
      return route("PATCH", url, handlers);
    },
    delete: (url, ...handlers) => {
      return route("DELETE", url, handlers);
    },
    options: (url, ...handlers) => {
      return route("OPTIONS", url, handlers);
    },
    head: (url, ...handlers) => {
      return route("HEAD", url, handlers);
    },
    routes: () => {
      return _routes;
    },
  };

  return router;
}
