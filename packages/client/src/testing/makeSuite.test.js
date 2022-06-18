import { h } from "../h.js";
import { makeSuite } from "./makeSuite.js";
import { wrapComponent } from "./wrapComponent.js";

test("runs tests", async () => {
  const suite = makeSuite((s) => {
    s.test("plans and waits for assertions", (t) => {
      t.plan(3);
      t.timeout(200);

      setTimeout(() => {
        t.truthy(true);
      }, 100);

      t.equal({ one: 1 }, { one: 1 }, "two different objects with equal values");

      t.throws(() => {
        throw new Error("It works!");
      });

      t.throws(() => {
        return new Promise((resolve, reject) => {
          reject("This counts");
        });
      });
    });
  });

  const results = await suite.run();

  const result = results.shift();

  expect(result.name).toBe("plans and waits for assertions");
  expect(result.pass).toBe(true);
  expect(result.meta.length).toBe(2);
  expect(result.assertions.length).toBe(3);
});

test("runs lifecycle hooks", async () => {
  let beforeAll = jest.fn();
  let beforeEach = jest.fn();
  let afterAll = jest.fn();
  let afterEach = jest.fn();

  const suite = makeSuite((s) => {
    s.beforeAll(beforeAll);
    s.afterAll(afterAll);
    s.beforeEach(beforeEach);
    s.afterEach(afterEach);

    s.test("one", (t) => {
      t.same(1, 1);
    });

    s.test("two", (t) => {
      t.same(2, 2);
    });
  });

  await suite.run();

  expect(beforeAll).toHaveBeenCalledTimes(1);
  expect(afterAll).toHaveBeenCalledTimes(1);
  expect(beforeEach).toHaveBeenCalledTimes(2);
  expect(afterEach).toHaveBeenCalledTimes(2);
});

describe("t.component", () => {
  test("creates a test container for a component", async () => {
    function Component($attrs, self) {
      return h("h1", $attrs.map("message"));
    }

    const Wrapped = wrapComponent(Component);

    const suite = makeSuite((s) => {
      s.test("component renders message", (t) => {
        t.plan(2);

        const component = t.component(Wrapped, { message: "It Lives!" });
        component.connect();

        const h1 = component.querySelector("h1");

        console.log({ h1, component });

        t.truthy(h1); // TODO: Cancel test as soon as one failed exception occurs
        t.equal(h1?.textContent, "It Lives!");
      });
    });

    const results = await suite.run();

    const result = results.shift();

    console.log(result);

    expect(result.name).toBe("component renders message");
    expect(result.pass).toBe(true);
  });
});
