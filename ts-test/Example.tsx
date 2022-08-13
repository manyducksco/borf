import { Component } from "@woofjs/client";
import type { AppServices } from "./test";

export const Example = new Component<{ name: string }, AppServices>(
  function () {
    const { example } = this.services;

    const $name = this.$attrs.map((a) => a.name);

    return <p>{example.message}</p>;
  }
);

class Example2 extends Component<{ name: string }, AppServices> {
  bootstrap() {
    return <p>{this.services.example.message}</p>;
  }
}

const Parent = new Component<{}, AppServices>(function () {
  const { users } = this.services;

  this.beforeConnect(async () => {
    const u = await users.getUsers();
  });

  return (
    <div>
      <Example2 name="A name">5</Example2>
    </div>
  );
});
