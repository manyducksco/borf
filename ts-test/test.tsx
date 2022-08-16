import {
  makeApp,
  makeComponent,
  makeService,
  makeState,
  mergeStates,
} from "@woofjs/client";

import type { ServicesOf } from "@woofjs/client";

// import { ExampleService } from "./Services";

const $label = makeState("asdf");
const $label2 = makeState(12345);

const $message = mergeStates(
  ([one, two]) => {
    return one + two;
  },
  $label,
  $label2
);

const ExampleService = makeService((self) => {
  // TODO: Service functions don't have self and context typed correctly.
  // self.

  return {
    /**
     * Comment that shows up on inline documentation.
     */
    message: "hello",
  };
});

const UserService = makeService((self) => {
  // self.options.

  return {
    async getUsers() {
      return [];
    },
  };
});

export const app = makeApp({
  // It's pretty much necessary to define the services in an object so the types can be extracted.
  services: {
    example: ExampleService,
    users: UserService,
    fn: () => ({ isFunction: true }),
  },
});

export type AppServices = ServicesOf<typeof app>;

const Example3 = makeComponent((self) => {
  const $title = self.$attrs.map((attrs) => attrs.title);

  const { http } = self.services;

  return null;
});
