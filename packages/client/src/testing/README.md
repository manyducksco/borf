# Testing Utils

`@woofjs/client` includes tools for unit testing its own components and services as well as components and services created by users for their own apps.

## Test suites

Test suites are objects that can be imported and run by a test runner. Here's how you create one:

```js
import { makeSuite } from "@woofjs/client/testing";

export default makeSuite((test) => {
  test.beforeAll(() => {
    // Runs once before the first test begins
  });

  test.beforeEach(() => {
    // Runs before each test is run
  });

  test.afterEach(() => {
    // Runs after each test finishes
  });

  test.afterAll(() => {
    // Runs once after all tests have finished
  });

  // The `test` function defines a test to run as part of this suite.
  test("fails", (t) => {
    t.equals(1, 2);
  });
});
```

## Writing tests

The `t` object passed to the test function includes some methods for configuring tests. Here they are:

```js
test("demonstrates testing tools", (t) => {
  /*=====================*\
  ||    Configuration    ||
  \*=====================*/

  // Expect three assertions to be made in this test.
  // If any other number of assertions is run this test will fail.
  t.plan(3);

  // Wait 500 milliseconds for async assertions to run.
  // If the planned amount of assertions hasn't run before this elapses the test will fail.
  t.timeout(500);

  /*=====================*\
  ||      Assertions     ||
  \*=====================*/

  // Assert that two values are literally the same object
  t.same(1, 1); // pass
  t.same([1, 2, 3], [1, 2, 3]); // fail (two different arrays)

  // Assert that two values are deep equal
  t.equal(1, 1); // pass
  t.equal([1, 2, 3], [1, 2, 3]); // pass

  // Assert that the value is truthy
  t.truthy(5); // pass
  t.truthy(null); // false

  // Assert that the value is falsy
  t.falsy(null); // pass
  t.falsy({ something: "anything" }); // false

  // Assert that the function call throws an error
  t.throws(() => {
    throw new Error("This fails as expected");
  });

  // All assertions can also be inverted:

  t.not.same(1, 2); // pass
  t.not.equal({}, {}); // fail
  t.not.truthy(false); // pass
  t.not.falsy(1); // pass
  t.not.throws(() => {}); // true

  /*=====================*\
  ||    Mock Functions   ||
  \*=====================*/

  const mock = t.mock.fn();

  mock();

  // Assert that this function has been called.
  t.called(mock);

  // Assert that this function was called exactly once.
  t.calledTimes(mock, 1);

  // Mock functions can also be given an implementation. Calls to this function will act like
  // the implementation, with the benefit of still being testable using mock function assertions.
  const doubleIt = t.mock.fn((n) => n * 2);

  // Mock functions return the value their implementation returns
  t.equal(doubleIt(2), 4);

  // Assert that the mock function was called at least once with a certain argument
  t.calledWith(doubleIt, 2);
  t.not.calledWith(doubleIt, 7);
});
```

## Testing components

```js
import { makeComponent } from "@woofjs/client";
import { wrapComponent } from "@woofjs/client/testing";

// A component that requires a service:
const Example = makeComponent(($, self) => {
  const { $messageOfTheDay } = self.getService("messages");

  return (
    <div>
      <h1>{$messageOfTheDay}</h1>
    </div>
  );
});

// And a wrapped version of that component that has a mock version of that service provided:
const WrappedExample = wrapComponent(Example, (self) => {
  self.service("messages", () => {
    const $messageOfTheDay = makeState("Hello From Mock Messages");

    return {
      $messageOfTheDay,
    };
  });
});
```

TODO: How do you actually test the component?

```js
test("component prints message", (t) => {
  t.plan(1);

  const rendered = t.render(WrappedExample, {
    /* attrs */
  });

  // Query for DOM rendered by this component
  rendered.querySelector("selector");

  t.equal(rendered.querySelector("div > h1").textContent, "Hello From Mock Messages");
});
```

### Views

Components can be visually tested using views. If you've ever used [Storybook](https://storybook.js.org/) this should be instantly familiar to you. Views are equivalent to stories in Storybook.

If you haven't used Storybook, views are like component examples you can view in a web browser to see how the component behaves with different attributes.

Views and tests can coexist within the same suite without issues.

```js
export default makeSuite((test, view) => {
  view("With Header Text", ($) => {
    return $(Header, { headerText: "Example Header" });
  });

  // Dynamic attributes allow the user to tweak attribute values themselves in the test environment
  view("With Dynamic Attrs", ($, attr) => {
    return $(Header, {
      // attr(name, defaultValue)
      headerText: attr("Header Text", "Example Header"),
      collapsed: attr("Collapsed", false),
    });
  });
});
```

## Testing services (and HTTP calls)

```js
import { makeService } from "@woofjs/client";
import { wrapService, makeMockHTTP } from "@woofjs/client/testing";

const mockHTTP = makeMockHTTP((self) => {
  // Define a mock responder for requests matching 'POST /users/create'
  self.post("/users/create", (ctx) => {
    ctx.response.status = 200;

    return {
      user: {
        id: 1,
        name: ctx.request.body.name,
        createdAt: new Date(),
      },
    };
  });

  self.delete("/users/:id", (ctx) => {
    ctx.response.status = 204;
  });
});

// A service that makes HTTP calls:
const UserService = makeService((self) => {
  function createUser(name) {
    return self.getService("@http").post("/users/create").body({ name });
  }

  function deleteUser(id) {
    return self.getService("@http").delete(`/users/${id}`);
  }

  return {
    createUser,
    deleteUser,
  };
});

// And a wrapped version of that service that uses a mock version of @http:
const WrappedUserService = wrapService(UserService, (self) => {
  self.service("@http", mockHTTP);
});
```

And to test:

```js
test("API calls return expected response", (t) => {
  t.plan(3);
  t.timeout(500);

  // TODO: Decide what the service version of the `.render` function is called
  const service = t.whatDoICallThis(WrappedUserService, {
    /* options */
  });

  service.createUser("Jimbo Jones").then((res) => {
    t.equals(res.status, 200);
    t.equals(res.body.name, "Jimbo Jones");
  });

  service.deleteUser(1).then((res) => {
    t.equals(res.status, 204);
  });
});
```
