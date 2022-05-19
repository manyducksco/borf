import { makeRouter } from "./makeRouter.js";
import http from "node:http";

export function makeApp(options = {}) {
  const router = makeRouter();
  const server = http.createServer();

  let staticPath = "./public";

  server.on("request", (req, res) => {
    console.log({ req, res });
    // const matched = router._match();

    // TODO: Match against router
    // TODO: Instantiate services
    // TODO: Parse body and headers
    // TODO: Run middleware and handlers
    // TODO: Respond and close
  });

  return {
    // Expose router methods from top level router...
    ...router,

    // ...Except for the _match method.
    _match: undefined,

    static(filePath) {
      if (filePath === false) {
        staticPath = false;
      } else if (typeof filePath === "string") {
        staticPath = filePath;
      } else {
        throw new Error(`Expected a string or false. Got: ${filePath}`);
      }
    },

    service(name, service) {},

    async listen(port) {
      return new Promise((resolve, reject) => {
        server.listen(port, (err) => {
          if (err) {
            return reject(err);
          }

          return resolve({
            port,
            /* info object */
          });
        });
      });
    },
  };
}
