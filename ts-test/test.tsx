import { App, Component, Service, State } from "@woofjs/client";

import type { ServicesOf } from "@woofjs/client";

// import { ExampleService } from "./Services";

const $label = new State("asdf");
const $label2 = new State(12345);

const $message = State.merge($label, $label2).into((one, two) => {
  return one + two;
});

const ExampleService = new Service((self) => {
  // TODO: Service functions don't have self and context typed correctly.
  // self.

  return {
    /**
     * Comment that shows up on inline documentation.
     */
    message: "hello",
  };
});

const UserService = new Service((self) => {
  // self.options.

  return {
    async getUsers() {
      return [];
    },
  };
});

export const app = new App({
  // It's pretty much necessary to define the services in an object so the types can be extracted.
  services: {
    example: ExampleService,
    users: UserService,
    fn: () => ({ isFunction: true }),
  },
});

export type AppServices = ServicesOf<typeof app>;

const Example3 = new Component((self) => {
  const $title = self.$attrs.map((attrs) => attrs.title);

  const { http } = self.services;

  return null;
});
