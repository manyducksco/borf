const { makeApp, makeRouter, h } = require("@woofjs/server");

const app = makeApp();

const exampleService = (self) => {
  return {
    call: () => {
      self.options.timesCalled++;
      return self.options.timesCalled;
    },
  };
};

const asyncService = async (self) => {
  let waitFor = 50 + Math.random() * 100;
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        call: () => {
          return waitFor;
        },
      });
    }, waitFor);
  });
};

app.service("example", exampleService, {
  options: {
    timesCalled: 0,
  },
});

app.service("async", asyncService);

app.use(async (ctx, next) => {
  const start = Date.now();
  ctx.response.headers["X-MIDDLEWARE-OUTLINE"] = "mrrp";
  await next();
  const end = Date.now();
  ctx.response.headers["X-TIMER"] = end - start + "ms";
});

app.post(
  "/full-test",
  (ctx, next) => {
    ctx.response.headers["X-MIDDLEWARE-INLINE"] = "RUFF";
    return next();
  },
  (ctx) => {
    const service = ctx.services.example;
    const asyncService = ctx.services.async;

    ctx.response.headers[
      "X-SERVICE-CALLS"
    ] = `Example Service called ${service.call()} times.`;

    ctx.response.headers[
      "X-REQUEST-METHOD"
    ] = `This is some CTX info: ${ctx.request.method}.`;

    ctx.response.headers[
      "X-REQUEST-BODY"
    ] = `This is some CTX info: ${ctx.request.body?.hello}.`;

    ctx.response.headers[
      "X-SERVICE-ASYNC"
    ] = `Async Service waited ${asyncService.call()} ms.`;

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          message: `Check the headers.`,
        });
      }, 50 + Math.random() * 100);
    });
  }
);

const router = makeRouter();
router.get("/test", () => {
  return "FROM ROUTER";
});

app.mount(router);
app.mount("/router", router);

app.get("/hello", (ctx) => {
  return "Hello world.";
});

app.get("/html", async (ctx) => {
  return h("main", h(AsyncHeader), h("p", "This is an HTML page."));
});

async function AsyncHeader() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(h("header", h("h1", "HELLO!")));
    }, 100);
  });
}

app.get("/form", () => {
  return h(Page, { title: "Form Test" }, h(Form));
});

app.get("/form/submitted", () => {
  return h(
    Page,
    { title: "Thanks" },
    h(
      "main",
      h("h1", "Thank you!"),
      h("p", "Your form has been submitted."),
      h("p", h("a", { href: "/form" }, "Return to Form"))
    )
  );
});

app.post("/form", (ctx) => {
  console.log("body", ctx.request.body);

  ctx.redirect("/form/submitted", 303);
});

function Page() {
  return h("html", [
    h("head", [h("meta", { charset: "utf-8" }), h("title", this.attrs.title)]),
    h("body", this.children),
  ]);
}

function Form() {
  return h(
    "form",
    { method: "post", action: "/form", enctype: "multipart/form-data" },
    [
      h("input", {
        name: "image",
        type: "file",
        accept: "image/*",
        required: true,
        multiple: true,
      }),
      h("input", {
        name: "description",
        type: "text",
        placeholder: "Description",
      }),
      h("button", "Submit Form"),
    ]
  );
}

// app.socket("/chat", (ctx) => {
//   let pingInterval;

//   ctx.onConnect(() => {
//     pingInterval = setInterval(() => {
//       ctx.sendMessage("It has been one second.");
//     }, 1000);
//   });

//   ctx.onMessage((message) => {
//     if (message === "ping") {
//       ctx.sendMessage("pong");
//     }
//   });

//   // ctx.sendMessage(() => {});

//   ctx.onDisconnect(() => {
//     clearInterval(pingInterval);
//   });
// });

// Listen for HTTP requests on localhost at specified port number.
app.listen(4000).then((info) => {
  console.log(`connected on port ${info.port}`);
});
