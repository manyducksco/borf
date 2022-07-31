import { makeMockHTTP } from "@woofjs/client/testing";

import HTTPRequestExample from "./HTTPRequestExample";

export default (view) => {
  view.name = "Mock HTTP example";
  view.description = "Test";

  view.service(
    "http",
    makeMockHTTP((self) => {
      self.get("/hello-json", (ctx) => {
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
