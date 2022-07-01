import { makeApp } from "@woofjs/server";

const app = makeApp();

const appExampleService = () => {
  return {
    call: () => {
      this.options.timesCalled++;
      return this.options.timesCalled;
    },
  };
};

const requestExampleService = () => {
  return {
    call: () => {
      this.options.timesCalled++;
      return this.options.timesCalled;
    },
  };
};

app.service("appExample", appExampleService, {
  lifecycle: "app",
  options: {
    timesCalled: 0,
  },
});

app.service("requestExample", requestExampleService, {
  lifecycle: "request",
  options: {
    timesCalled: 0,
  },
});

app.get("/app", (ctx) => {
  const service = ctx.getService("appExample");
  return {
    message: `App service called ${service.call()} times.`,
  };
});

app.get("/request", (ctx) => {
  const service = ctx.getService("requestExample");
  return {
    message: `Request service called ${service.call()} times.`,
  };
});

app.get("/hello", (ctx) => {
  // An object returned from a route becomes a JSON body automatically.
  return {
    message: `This is some CTX info: ${ctx.request.method}.`,
  };
});

app.post("/hello", (ctx) => {
  // An object returned from a route becomes a JSON body automatically.
  ctx.response.status = 200;
  return {
    message: `This is some CTX info: ${ctx.request.body.hello}.`,
  };
});

// Listen for HTTP requests on localhost at specified port number.
app.listen(4000).then((info) => {
  console.log(`connected on port ${info.port}`);
});
