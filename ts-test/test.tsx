import { App, Component, Service, ServiceFn, ServicesOf } from "@woofjs/client";

const message = new Service((self) => {
  return {
    message: "hello",
  };
});

const app = new App({
  services: {
    message: message,
  },
});

type AppServices = ServicesOf<typeof app>;

interface ExampleAttrs {
  title: string;
}

interface ServicesType {
  arbitrary: {
    whatever: string;
  };
}

const Example = new Component<ExampleAttrs, ServicesType>(function () {
  this.debug.name = "Example";

  const $title = this.$attrs.map((attrs) => attrs.title);

  const { http, page, router, arbitrary } = this.services;

  http.use(async (ctx, next) => {});

  // http.get("/test")

  // self.services.

  return null;
  // return <h1>{$title}</h1>;
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
