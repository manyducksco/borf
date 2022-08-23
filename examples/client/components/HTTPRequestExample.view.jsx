import { makeMockHTTP } from "@woofjs/client/testing";
import { HTTPRequestExample } from "./HTTPRequestExample.js";

export default (view) => {
  view.name = "Mock HTTP example";
  view.description = "Test";

  view.service(
    "http",
    makeMockHTTP((on) => {
      on.get("/hello-json", (ctx) => {
        // fireAction fires an action when called without needing to be passed as a component attribute.
        view.fireAction("made request");

        return {
          message: "Hello from mock HTTP!",
        };
      });
    })
  );

  view.render(HTTPRequestExample);
};
