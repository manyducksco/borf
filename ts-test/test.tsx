import { App, Component, Service } from "@woofjs/client";

import type { ServicesOf } from "@woofjs/client";

import { ExampleService } from "./Services";

// const ExampleService = new Service((self) => {
//   return {
//     /**
//      * Comment that shows up on inline documentation.
//      */
//     message: "hello",
//   };
// });

const UserService = new Service((self) => {
  // self.options.

  return {
    async getUsers() {
      return [];
    },
  };
});

const options = {
  services: {
    example: ExampleService,
  },
};

const app = new App({
  // It's pretty much necessary to define the services in an object so the types can be extracted.
  services: {
    example: ExampleService,
    users: UserService,
  },
});

export type AppServices = ServicesOf<typeof app>;

// Define components from the app to automatically inherit the app's types?
const Example0 = app.component(function () {
  this.services.example.message;

  return null;
});

class Example2 extends Component<{}, AppServices> {
  bootstrap() {
    this.services.example.message;

    return null;
  }
}

const Example3 = new Component((self) => {
  const $title = self.$attrs.map((attrs) => attrs.title);

  const { http } = self.services;

  return null;
});
