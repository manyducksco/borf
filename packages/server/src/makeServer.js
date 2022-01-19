import { makeRouter } from "./makeRouter.js";

export function makeServer(options = {}) {
  const router = makeRouter();

  const server = {
    ...router,

    service(name, service) {},

    async listen(port) {},
  };

  return server;
}
