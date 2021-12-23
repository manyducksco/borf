# Testing

There is currently a browser-based test environment for browser components. I wonder if it makes sense to implement the same test framework in Node (without views) for the server components. The server-side tests could run as their own process and send their results to the browser through server-sent events.

- On one server:
  - File watcher for `server/` which runs server side tests and reports results
  - File watcher for `app/` which rebuilds test bundle
    - Tests for `app/` are run in the browser
    - Gets list of server-side tests and requests to run them when visiting their URL (works the same as browser tests, only calls Node process to run and get results)
  - Web server that serves app bundle and mediates with server test runner

Server tests should be shown side by side with app tests (under different heading) and look and work identically.

Could also run all tests in CLI by using JSDOM for the browser parts.

## Unit Testing API

```js
import { suite } from "@woofjs/testing";

export default suite((test, view) => {
  // Define a view (this param is not passed for server tests)
  view(name, ($, { attr }) => {
    return $("div")("text");
  });

  test.beforeEach(() => {
    // do something before each test in this suite.
  });

  test.afterEach(() => {
    // do something after each test in this suite.
  });

  test.beforeAll(() => {
    // do something before running any tests in this suite.
  });

  test.afterAll(() => {
    // do something after running all tests in this suite.
  });

  // Define a test
  test(name, (t) => {
    // Required: plan number of assertions. This must match the number of assertions your test actually makes.
    t.plan(3); // expect 3 assertions with default async timeout
    t.plan(3, 500); // expect 3 assertions, waiting 500ms for async assertions

    // Expect two values to be equal by value (deep equal for objects)
    // signature: t.equal(one, two[, message])
    t.equal(1, 2, "numbers should be equal");

    // Assert that both values are literally the same object. This test will fail:
    t.same({ test: 1 }, { test: 1 });

    // Assert that properties in expected object are equal to properties in actual object,
    // but not all properties must be present.
    t.partialEqual(
      {
        name: "test",
        method: "ffffff",
      },
      {
        method: "ffffff",
      }
    );

    // Assert that the function throws an error
    t.throws(() => throw new Error("This is an error"));
    t.throws(() => throw new Error("This is an error"), /an error/); // Asserts that error message matches regex
    t.throws(() => throw new Error("This is an error"), { code: 222 }); // Asserts that error object includes matching properties

    // Assertions are available under t.not which inverts their results
    t.not.equal(1, 2, "numbers should not be equal");
    t.not.same(1, 2);
    t.not.throws(() => "Does not throw");

    // Mock utilities are under t.mock:

    // Create a mock function
    // Takes an optional function to implement the mock's behavior, like when the function needs to return a value.
    const func = t.mock.fn((n) => {
      return n * 2;
    });

    func(3);
    func(4);
    func(5);

    func.mock.calls; // array of calls: [{ args: [3] }, { args: [4] }, { args: [5] }]

    t.called(func); // Asserts that mock function was called at least once.
    t.calledWith(func, 5); // Asserts that 5 was passed as an argument in at least one call.
    t.calledTimes(func, 3); // Asserts that mock function was called exactly this number of times.

    t.not.called(func);
    t.not.calledWith(func, 5);
    t.not.calledTimes(func, 2);
  });

  // Skip a test
  test.skip(name, (t) => {
    t.plan(1);
    t.equal(true, false);
  });
});
```
