import { makeComponent } from "@woofjs/client";
import { prop } from "ramda";
import type { AppServices } from "./test";

type ExampleAttrs = {
  name: string;
};

export const Example = makeComponent<AppServices, ExampleAttrs>((ctx) => {
  const example = ctx.getService("example");
  const users = ctx.getService("users");

  const $name = ctx.$attrs.map(prop("name"));

  ctx.subscribeTo($name, (value) => {
    console.log(value);
  });

  return <p>{example.message}</p>;
});

const Parent = makeComponent<AppServices>((ctx) => {
  const http = ctx.getService("http");
  const users = ctx.getService("users");

  ctx.beforeConnect(async () => {
    const u = await users.getUsers();
  });

  http.get("/test").then((res) => {
    console.log(res);
  });

  return (
    <div id={(5).toString()} style={{ backgroundColor: "#fff" }}>
      <h1 lang="en" translate="yes">
        Test
      </h1>

      <Example name={5}>5</Example>
      <Example name="test">
        <div>Children should not be allowed</div>
        <div>Not allowed</div>
      </Example>
    </div>
  );
});
