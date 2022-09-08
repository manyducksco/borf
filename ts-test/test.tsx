import {
  makeApp,
  makeComponent,
  makeService,
  makeState,
  mergeStates,
  ServicesOf,
} from "@woofjs/client";

const $label = makeState("asdf");
const $label2 = makeState(12345);
const $label3 = makeState("123123");

const $message = mergeStates($label, $label2)
  .with($label3)
  .into((one, two, three) => {
    return one + two + three;
  });

const ExampleService = makeService((ctx) => {
  return {
    /**
     * Comment that shows up on inline documentation.
     */
    message: "hello",
  };
});

const UserService = makeService((ctx) => {
  return {
    async getUsers() {
      return [];
    },
  };
});

export type AppServices = {
  example: typeof ExampleService;
  users: typeof UserService;
  fn: () => { isFunction: true };
};

export const app = makeApp<AppServices>();

app.service("example", ExampleService);
app.service("users", UserService);
app.service("fn", () => ({ isFunction: true }));

const Example3 = makeComponent<AppServices, { title: string }>((ctx) => {
  const $title = ctx.$attrs.map((attrs) => attrs.title);

  const http = ctx.getService("http");
  const example = ctx.getService("example");
  const fn = ctx.getService("fn");

  return null;
});
