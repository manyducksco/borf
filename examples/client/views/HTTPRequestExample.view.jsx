import { makeMockHTTP } from "@woofjs/client/testing";
import { HTTPRequestExample } from "./HTTPRequestExample.js";

export default makeFixture((fix) => {
  fix.name = "Mock HTTP example";
  fix.description = "Test";

  fix.global(
    "http",
    makeMockHTTP((handle) => {
      handle.get("/hello-json", (ctx) => {
        // fireAction fires an action when called without needing to be passed as a component attribute.
        fix.fireAction("made request");

        return {
          message: "Hello from mock HTTP!",
        };
      });
    })
  );

  return <HTTPRequestExample />;
});
