import { Component } from "@woofjs/client";
import { app } from "./test";
import type { AppServices } from "./test";

type ExampleAttrs = {
  name: string;
};

export const Example = new Component<ExampleAttrs, AppServices>(function () {
  const { example, users } = this.services;

  const $name = this.$attrs.map((a) => a.name);

  this.subscribeTo($name, (value) => {
    console.log(value);
  });

  return <p>{example.message}</p>;
});

const Parent = new Component(app, function () {
  const { users } = this.services;

  this.beforeConnect(async () => {
    const u = await users.getUsers();
  });

  return (
    <div id={5}>
      <Example name={5}>5</Example>
    </div>
  );
});
