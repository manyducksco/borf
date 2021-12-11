/**
 * Default server in case the app has no server of its own.
 */
const http = require("http");

const server = http.createServer((req, res) => {
  console.log({ req, res });
});

server.listen(7070);
