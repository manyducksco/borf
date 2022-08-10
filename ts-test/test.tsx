import { makeApp, Component } from "@woofjs/client";

const app = makeApp();

interface ExampleAttrs {
  title: string;
}

interface ServicesType {
  arbitrary: {
    whatever: string;
  };
}

const Example = new Component<ExampleAttrs, ServicesType>((self) => {
  const $title = self.$attrs.map((attrs) => attrs.title);

  const { http, page, router, arbitrary } = self.services;

  // http.get("/test")

  // self.services.

  return null;
});

class Example2 extends Component<ExampleAttrs, ServicesType> {
  bootstrap() {
    this.services.http.get("/test");

    return null;
  }
}

const Example3 = new Component((self) => {
  const $title = self.$attrs.map((attrs) => attrs.title);

  const { http } = self.services;

  return null;
});
