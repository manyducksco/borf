import test from "ava";
import sinon from "sinon";
import { DebugHub, makeMatcher } from "./DebugHub.js";

test("filter is populated from options", (t) => {
  const debug = new DebugHub({ filter: "*,-test:*" });

  t.is(debug.filter, "*,-test:*");
});

test("filters out internal borf:* messages by default", (t) => {
  const debug = new DebugHub();

  t.is(debug.filter, "*,-borf:*");
});

test("names don't allow commas", (t) => {
  const debug = new DebugHub();

  // Not allowed when you make a channel
  t.throws(() => {
    debug.channel("this,is,not,allowed");
  });
});

test("silences messages by type with options", (t) => {
  const _console = {
    log: sinon.fake(),
    warn: sinon.fake(),
    error: sinon.fake(),
  };

  const noLog = new DebugHub({ log: false }, _console as any).channel("test");
  const noWarn = new DebugHub({ warn: false }, _console as any).channel("test");
  const noError = new DebugHub({ error: false }, _console as any).channel("test");

  noLog.log("silent");
  noLog.warn("prints");
  noLog.error("prints");

  t.is(_console.log.callCount, 0);
  t.is(_console.warn.callCount, 1);
  t.is(_console.error.callCount, 1);

  noWarn.log("prints");
  noWarn.warn("silent");
  noWarn.error("prints");

  t.is(_console.log.callCount, 1);
  t.is(_console.warn.callCount, 1);
  t.is(_console.error.callCount, 2);

  noError.log("prints");
  noError.warn("prints");
  noError.error("silent");

  t.is(_console.log.callCount, 2);
  t.is(_console.warn.callCount, 2);
  t.is(_console.error.callCount, 2);
});

test("makeMatcher: correctly parses filter string or regex", (t) => {
  const matchOne = makeMatcher("*"); // Allow everything
  const matchTwo = makeMatcher("test:*"); // Only allow things starting with 'test:'
  const matchThree = makeMatcher("*,-test:*"); // Allow everything, but exclude channels starting with 'test:'
  const matchFour = makeMatcher(/^test\:|name$/); // starts with 'test:' or ends with 'name'
  const matchFive = makeMatcher("jwioefnm234,test:one");

  const nameOne = "test:one";
  const nameTwo = "jwioefnm234";
  const nameThree = "other:name";
  const nameFour = "test:allowed";

  t.true(matchOne(nameOne));
  t.true(matchOne(nameTwo));
  t.true(matchOne(nameThree));
  t.true(matchOne(nameFour));

  t.true(matchTwo(nameOne));
  t.false(matchTwo(nameTwo));
  t.false(matchTwo(nameThree));
  t.true(matchTwo(nameFour));

  t.false(matchThree(nameOne));
  t.true(matchThree(nameTwo));
  t.true(matchThree(nameThree));
  t.false(matchThree(nameFour));

  t.true(matchFour(nameOne));
  t.false(matchFour(nameTwo));
  t.true(matchFour(nameThree));
  t.true(matchFour(nameFour));

  t.true(matchFive(nameOne));
  t.true(matchFive(nameTwo));
  t.false(matchFive(nameThree));
  t.false(matchFive(nameFour));
});
