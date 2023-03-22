export { wrapRouter } from "./wrappers/wrapRouter.js";

export class RouterTester {
  constructor(router) {}
}

// Create tester and add handlers, then make requests against the router.
const tester = new RouterTester(someRouter)
  .onGet("/some/url", (ctx) => {
    return {
      response: "yes",
    };
  })
  .onPost("/other/url", (ctx) => {
    console.log(ctx.request.body);
  });
