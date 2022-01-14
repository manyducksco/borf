import { makeApp } from "@woofjs/app";

const app = makeApp({
  hash: true,
});

app.route("*", ($) => {
  return $("h1")("Hello World");
});

app.connect("#app");
