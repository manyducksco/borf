import { makeMockHTTP } from "@woofjs/client/testing";

import HTTPRequestExample from "./HTTPRequestExample";

const mockHTTP = makeMockHTTP((self) => {
  self.get("https://dog.ceo/api/breeds/image/random", (ctx) => {
    return {
      message:
        "https://images.dog.ceo/breeds/deerhound-scottish/n02092002_14369.jpg",
      status: "success",
    };
  });
});

export default (view) => {
  view.name = "Mock HTTP example";
  view.description = "Test";

  view.service("@http", mockHTTP);

  view.render(HTTPRequestExample);
};
