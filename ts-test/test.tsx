import type { Component, ServiceContext } from "@woofjs/client";

import { makeApp, makeState, mergeStates } from "@woofjs/client";

const $label = makeState("asdf");
const $label2 = makeState(12345);
const $label3 = makeState("123123");

const $message = mergeStates($label, $label2)
  .with($label3)
  .into((one, two, three) => {
    return one + two + three;
  });

const ExampleService = function (this: ServiceContext<Services>) {
  const router = this.getService("router");

  return {
    /**
     * Comment that shows up on inline documentation.
     */
    message: "hello",
  };
};

const UserService = function (this: ServiceContext<Services>) {
  return {
    async getUsers() {
      return [];
    },
  };
};

export type Services = {
  example: typeof ExampleService;
  users: typeof UserService;
  fn: () => { isFunction: true };
};

export const app = makeApp<Services>();

app.service("example", ExampleService);
app.service("users", UserService);
app.service("fn", () => ({ isFunction: true }));

const Example1: Component<Services> = function () {
  const http = this.getService("http");
  const example = this.getService("example");

  return (
    <div class="class">
      <Example2 name={5} />
    </div>
  );
};

type Example2Attrs = {
  name: string;
};

const Example2: Component<Services, Example2Attrs> = function () {
  const name = this.$attrs.get((a) => a.name);

  return <div>Hello</div>;
};

app.route("/examples/1", Example1);
app.redirect("*", "/examples/1");
