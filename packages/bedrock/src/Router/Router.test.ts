import test from "ava";

import { Router } from "./Router.js";

test("add and match routes", (t) => {
  const router = new Router<{ testId: number }>();

  router
    .addRoute("/{named}", { testId: 1 })
    .addRoute("/users/{#id}", { testId: 2 }) // Matches only a numeric `id`
    .addRoute("/users/me", { testId: 3 })
    .addRoute("/users/{#id}/{action}", { testId: 4 }) // Matches a numeric `id` and any string for `action`.
    .addRoute("/users/2/edit", { testId: 5 })
    .addRoute("/wild/*", { testId: 6 }); // Matches any URL starting with '/wild'

  const match1 = router.match("/example");
  const match2 = router.match("/users/123");
  const match3 = router.match("/users/me");
  const match4 = router.match(
    // Query params should be parsed but won't affect path matching.
    "/users/123/edit?example=5&other_thing=test&yes=true"
  );
  const match5 = router.match("/users/2/edit");
  const match6 = router.match("/wild/some/other/stuff");
  const matchNone = router.match("/no/matches/too/many/segments");

  t.truthy(match1);
  t.is(match1!.meta.testId, 1);
  t.deepEqual(match1!.params, { named: "example" });

  t.truthy(match2);
  t.is(match2!.meta.testId, 2);
  t.deepEqual(match2!.params, { id: 123 });

  t.truthy(match3);
  t.is(match3!.meta.testId, 3);
  t.deepEqual(match3!.params, {});

  t.truthy(match4);
  t.is(match4!.meta.testId, 4);
  t.deepEqual(match4!.params, { id: 123, action: "edit" });
  // Numeric strings and boolean "true" and "false" strings are parsed into their JS type:
  t.deepEqual(match4!.query, { example: 5, other_thing: "test", yes: true });

  t.truthy(match5);
  t.is(match5!.meta.testId, 5);
  t.deepEqual(match5!.params, {});

  t.truthy(match6);
  t.is(match6!.meta.testId, 6);
  t.deepEqual(match6!.params, { wildcard: "/some/other/stuff" });

  t.is(matchNone, undefined);
});

test("static joinPath: joins simple path fragments", (t) => {
  t.is(Router.joinPath(["users", 5, "edit"]), "users/5/edit");
  t.is(Router.joinPath(["/lots", "/of/", "/slashes/"]), "/lots/of/slashes");
  t.is(Router.joinPath(["even/", "/more/", "slashes"]), "even/more/slashes");
});

test("static joinPath: resolves relative path segments", (t) => {
  t.is(Router.joinPath(["users", 5, "edit", "../../12"]), "users/12");
  t.is(Router.joinPath(["users", 15, "./edit"]), "users/15/edit");
});

test("static resolvePath: resolves relative paths", (t) => {
  t.is(Router.resolvePath("/users/5", "."), "/users/5");
  t.is(Router.resolvePath("/users/5/edit", ".."), "/users/5");
  t.is(Router.resolvePath("/users/5/edit", "../../2/"), "/users/2");
  t.is(Router.resolvePath("/users/5", "./edit"), "/users/5/edit");
  t.is(Router.resolvePath("/users/5", "edit"), "/users/5/edit");
  t.is(Router.resolvePath("/users/5/edit", "../delete"), "/users/5/delete");
});

test("static resolvePath: returns absolute paths", (t) => {
  t.is(Router.resolvePath("/users/5", "/edit"), "/edit");
});
