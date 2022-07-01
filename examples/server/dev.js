import { makeApp } from "@woofjs/server";

const app = makeApp();

app.get("/hello", (ctx) => {
  // An object returned from a route becomes a JSON body automatically.
  return {
    message: `This is some CTX info: ${ctx.request.verb}.`,
  };
});

app.post("/hello", (ctx) => {
  // An object returned from a route becomes a JSON body automatically.
  return {
    message: `This is some CTX info: ${ctx.request.body.hello}.`,
  };
});

// Listen for HTTP requests on localhost at specified port number.
app.listen(4000).then((info) => {
  console.log(`connected on port ${info.port}`);
});
