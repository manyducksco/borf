import { makeComponent } from "@woofjs/client";
import { app } from "./test";
import type { AppServices } from "./test";

type ExampleAttrs = {
  name: string;
};

export const Example = makeComponent<ExampleAttrs, AppServices>(function () {
  const { example, users } = this.services;

  const $name = this.$attrs.map((a) => a.name);

  this.subscribeTo($name, (value) => {
    console.log(value);
  });

  return <p>{example.message}</p>;
});

export const Example2 = makeComponent<ExampleAttrs>(app, function () {
  const { example, users } = this.services;

  this.services.

  const $name = this.$attrs.map((a) => a.name);

  this.subscribeTo($name, (value) => {
    console.log(value);
  });

  return <p>{example.message}</p>;
});

const Parent = makeComponent(app, function () {
  const { users, http } = this.services;

  this.beforeConnect(async () => {
    const u = await users.getUsers();
  });

  http.get("/test").then(res => {
    console.log(res);
  })

  return (
    <div id={5}>
      <Example name={5}>5</Example>
    </div>
  );
});
