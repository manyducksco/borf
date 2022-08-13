import { Service } from "@woofjs/client";
import type { AppServices } from "./test";

export const ExampleService = new Service<{}, AppServices>(function () {
  return {
    test: true,
  };
});
