import { Component } from "@woofjs/client";
import type { AppServices } from "./test";

type ExampleAttrs = {
  name: string;
};

export const Example = new Component<ExampleAttrs, AppServices>(function () {
  const { example } = this.services;

  const $name = this.$attrs.map((a) => a.name);

  return <p>{example.message}</p>;
});

const Parent = new Component<{}, AppServices>(function () {
  const { users } = this.services;

  this.beforeConnect(async () => {
    const u = await users.getUsers();
  });

  return (
    <div>
      <Example name={5}>5</Example>
    </div>
  );
});
