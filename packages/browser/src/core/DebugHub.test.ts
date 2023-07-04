import test from "ava";
import { makeMatcher } from "./DebugHub.js";

test("makeMatcher correctly parses filter string or regex", (t) => {
  const matchOne = makeMatcher("*"); // Allow everything
  const matchTwo = makeMatcher("test:*"); // Only allow things starting with 'test:'
  const matchThree = makeMatcher("*,-test:*"); // Allow everything, but exclude channels starting with 'test:'
  const matchFour = makeMatcher(/^test:|name$/); // starts with 'test:' or ends with 'name'
  const matchFive = makeMatcher("jwioefnm234,test:one");

  const nameOne = "test:one";
  const nameTwo = "jwioefnm234";
  const nameThree = "other:name";
  const nameFour = "test:allowed";

  t.truthy(matchOne(nameOne));
  t.truthy(matchOne(nameTwo));
  t.truthy(matchOne(nameThree));
  t.truthy(matchOne(nameFour));

  t.truthy(matchTwo(nameOne));
  t.falsy(matchTwo(nameTwo));
  t.falsy(matchTwo(nameThree));
  t.truthy(matchTwo(nameFour));

  t.falsy(matchThree(nameOne));
  t.truthy(matchThree(nameTwo));
  t.truthy(matchThree(nameThree));
  t.falsy(matchThree(nameFour));

  t.truthy(matchFour(nameOne));
  t.falsy(matchFour(nameTwo));
  t.truthy(matchFour(nameThree));
  t.truthy(matchFour(nameFour));

  t.truthy(matchFive(nameOne));
  t.truthy(matchFive(nameTwo));
  t.falsy(matchFive(nameThree));
  t.falsy(matchFive(nameFour));
});

// describe("makeDebug", () => {
//   test("filter is populated from options", () => {
//     const debug = makeDebug({ filter: "*,-test:*" });

//     expect(debug.$filter.get()).toBe("*,-test:*");
//   });

//   test("filters out internal woof:* messages by default", () => {
//     const debug = makeDebug();

//     expect(debug.$filter.get()).toBe("*,-woof:*");
//   });

//   test("can change name", () => {
//     const channel = makeDebug().makeChannel("default");

//     expect(channel.name).toBe("default");

//     channel.name = "newName";

//     expect(channel.name).toBe("newName");
//   });

//   test("names don't allow commas", () => {
//     const debug = makeDebug();

//     // Not allowed when you make a channel
//     expect(() => {
//       debug.makeChannel("this,is,not,allowed");
//     }).toThrow();

//     // Also not allowed when you rename a channel
//     expect(() => {
//       const channel = debug.makeChannel("default");

//       channel.name = "also,not,allowed";
//     }).toThrow();
//   });

//   test("silences messages by type with options", () => {
//     const _console = {
//       log: jest.fn(),
//       warn: jest.fn(),
//       error: jest.fn(),
//     };

//     const noLog = makeDebug({ log: false, _console }).makeChannel("test");
//     const noWarn = makeDebug({ warn: false, _console }).makeChannel("test");
//     const noError = makeDebug({ error: false, _console }).makeChannel("test");

//     noLog.log("silent");
//     noLog.warn("prints");
//     noLog.error("prints");

//     expect(_console.log).toHaveBeenCalledTimes(0);
//     expect(_console.warn).toHaveBeenCalledTimes(1);
//     expect(_console.error).toHaveBeenCalledTimes(1);

//     noWarn.log("prints");
//     noWarn.warn("silent");
//     noWarn.error("prints");

//     expect(_console.log).toHaveBeenCalledTimes(1);
//     expect(_console.warn).toHaveBeenCalledTimes(1);
//     expect(_console.error).toHaveBeenCalledTimes(2);

//     noError.log("prints");
//     noError.warn("prints");
//     noError.error("silent");

//     expect(_console.log).toHaveBeenCalledTimes(2);
//     expect(_console.warn).toHaveBeenCalledTimes(2);
//     expect(_console.error).toHaveBeenCalledTimes(2);
//   });
// });
