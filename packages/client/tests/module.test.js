import woof, {
  state,
  Component,
  Service,
  Keyboard,
  Styles,
} from "../dist/woof";

test("exports expected things", () => {
  expect(typeof woof).toBe("function");
  expect(typeof state).toBe("function");
  expect(typeof Component).toBe("function");
  expect(Component.isComponent).toBe(true);
  expect(typeof Service).toBe("function");
  expect(typeof Keyboard).toBe("object");
  expect(typeof Styles).toBe("function");
});

test("default function creates an App instance", () => {
  const app = woof();

  expect(typeof app.init).toBe("function");
  expect(typeof app.service).toBe("function");
  expect(typeof app.route).toBe("function");
  expect(typeof app.start).toBe("function");
});
