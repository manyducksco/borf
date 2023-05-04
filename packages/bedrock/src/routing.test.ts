import test from "ava";

import {
  Route,
  patternToFragments,
  matchRoutes,
  joinPath,
  resolvePath,
} from "./routing.js";

test("add and match routes", (t) => {
  const routes: Route<{ testId: number }>[] = [];

  routes.push({
    pattern: "/{named}",
    meta: { testId: 1 },
    fragments: patternToFragments("/{named}"),
  });
  routes.push({
    pattern: "/users/{#id}",
    meta: { testId: 2 },
    fragments: patternToFragments("/users/{#id}"),
  });
  routes.push({
    pattern: "/users/me",
    meta: { testId: 3 },
    fragments: patternToFragments("/users/me"),
  });
  routes.push({
    pattern: "/users/{#id}/{action}",
    meta: { testId: 4 },
    fragments: patternToFragments("/users/{#id}/{action}"),
  });
  routes.push({
    pattern: "/users/2/edit",
    meta: { testId: 5 },
    fragments: patternToFragments("/users/2/edit"),
  });
  routes.push({
    pattern: "/wild/*",
    meta: { testId: 6 },
    fragments: patternToFragments("/wild/*"),
  });

  const match1 = matchRoutes(routes, "/example");
  const match2 = matchRoutes(routes, "/users/123");
  const match3 = matchRoutes(routes, "/users/me");
  const match4 = matchRoutes(
    routes,
    // Query params should be parsed but won't affect path matching.
    "/users/123/edit?example=5&other_thing=test&yes=true"
  );
  const match5 = matchRoutes(routes, "/users/2/edit");
  const match6 = matchRoutes(routes, "/wild/some/other/stuff");
  const matchNone = matchRoutes(routes, "/no/matches/too/many/segments");

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
  t.is(joinPath(["users", 5, "edit"]), "users/5/edit");
  t.is(joinPath(["/lots", "/of/", "/slashes/"]), "/lots/of/slashes");
  t.is(joinPath(["even/", "/more/", "slashes"]), "even/more/slashes");
});

test("static joinPath: resolves relative path segments", (t) => {
  t.is(joinPath(["users", 5, "edit", "../../12"]), "users/12");
  t.is(joinPath(["users", 15, "./edit"]), "users/15/edit");
});

test("static resolvePath: resolves relative paths", (t) => {
  t.is(resolvePath("/users/5", "."), "/users/5");
  t.is(resolvePath("/users/5/edit", ".."), "/users/5");
  t.is(resolvePath("/users/5/edit", "../../2/"), "/users/2");
  t.is(resolvePath("/users/5", "./edit"), "/users/5/edit");
  t.is(resolvePath("/users/5", "edit"), "/users/5/edit");
  t.is(resolvePath("/users/5/edit", "../delete"), "/users/5/delete");
});

test("static resolvePath: returns absolute paths", (t) => {
  t.is(resolvePath("/users/5", "/edit"), "/edit");
});
