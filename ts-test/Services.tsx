import { makeService } from "@woofjs/client";

export const ExampleService = makeService((ctx) => {
  const users = ctx.getService("users");

  users.getUsers().then(() => {
    ctx.debug.log();
  });

  return {
    test: true,
  };
});
