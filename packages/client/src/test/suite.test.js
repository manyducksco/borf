import { suite } from "./suite";

test("runs tests", async () => {
  const tests = suite((test) => {
    test("plans and waits for assertions", (t) => {
      t.plan(2);
      t.timeout(200);

      setTimeout(() => {
        t.truthy(true);
      }, 100);

      t.equal({ one: 1 }, { one: 1 }, "two different objects with equal values");
    });
  });

  const results = await tests.run();

  const result = results.shift();

  // console.log(result);

  expect(result.name).toBe("plans and waits for assertions");
  expect(result.pass).toBe(true);
  expect(result.meta.length).toBe(2);
  expect(result.assertions.length).toBe(2);
});
