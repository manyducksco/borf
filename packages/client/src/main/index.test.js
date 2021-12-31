import { App, Component, Service, Styles, makeState } from "./index.js";

test("exports expected things", () => {
  expect(typeof App).toBe("function");
  expect(typeof Component).toBe("function");
  expect(Component.isComponent).toBe(true);
  expect(typeof Service).toBe("function");
  expect(Service.isService).toBe(true);
  expect(typeof Styles).toBe("function");
  expect(typeof makeState).toBe("function");
});
