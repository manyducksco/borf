import { App, Component, Service, Styles, state } from "./index.js";

test("exports expected things", () => {
  expect(typeof App).toBe("function");
  expect(typeof Component).toBe("function");
  expect(Component.isComponent).toBe(true);
  expect(typeof Service).toBe("function");
  expect(Service.isService).toBe(true);
  expect(typeof Styles).toBe("function");
  expect(typeof state).toBe("function");
});

test("default function creates an App instance", () => {
  const app = woof();

  expect(typeof app.setup).toBe("function");
  expect(typeof app.service).toBe("function");
  expect(typeof app.route).toBe("function");
  expect(typeof app.connect).toBe("function");
});
