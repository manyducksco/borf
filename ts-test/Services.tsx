import { makeService } from "@woofjs/client";
import type { AppServices } from "./test";

export const ExampleService = makeService((ctx) => {
  const services = ctx.services as AppServices;

  services.users.getUsers().then(() => {
    ctx.debug.log();
  });

  return {
    test: true,
  };
});
