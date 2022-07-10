import { makeMockHTTP } from "@woofjs/client/testing";

import HTTPRequestExample from "./HTTPRequestExample";

export default (view) => {
  view.name = "Mock HTTP example";
  view.description = "Test";

  view.service(
    "http",
    makeMockHTTP((self) => {
      self.get("https://dog.ceo/api/breeds/image/random", (ctx) => {
        // fireAction fires an action when called without needing to be passed as a component attribute.
        view.fireAction("requested dog image");

        return {
          message:
            "https://images.dog.ceo/breeds/deerhound-scottish/n02092002_14369.jpg",
          status: "success",
        };
      });
    })
  );

  view.render(HTTPRequestExample);
};
