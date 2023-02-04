import { makeMatcher } from "./DebugHub.js";

describe("makeMatch", () => {
  test("correctly parses filter string or regex", () => {
    const matchOne = makeMatcher("*"); // Allow everything
    const matchTwo = makeMatcher("test:*"); // Only allow things starting with 'test:'
    const matchThree = makeMatcher("*,-test:*"); // Allow everything, but exclude channels starting with 'test:'
    const matchFour = makeMatcher(/^test:|name$/); // starts with 'test:' or ends with 'name'
    const matchFive = makeMatcher("jwioefnm234,test:one");

    const nameOne = "test:one";
    const nameTwo = "jwioefnm234";
    const nameThree = "other:name";
    const nameFour = "test:allowed";

    expect(matchOne(nameOne)).toBe(true);
    expect(matchOne(nameTwo)).toBe(true);
    expect(matchOne(nameThree)).toBe(true);
    expect(matchOne(nameFour)).toBe(true);

    expect(matchTwo(nameOne)).toBe(true);
    expect(matchTwo(nameTwo)).toBe(false);
    expect(matchTwo(nameThree)).toBe(false);
    expect(matchTwo(nameFour)).toBe(true);

    expect(matchThree(nameOne)).toBe(false);
    expect(matchThree(nameTwo)).toBe(true);
    expect(matchThree(nameThree)).toBe(true);
    expect(matchThree(nameFour)).toBe(false);

    expect(matchFour(nameOne)).toBe(true);
    expect(matchFour(nameTwo)).toBe(false);
    expect(matchFour(nameThree)).toBe(true);
    expect(matchFour(nameFour)).toBe(true);

    expect(matchFive(nameOne)).toBe(true);
    expect(matchFive(nameTwo)).toBe(true);
    expect(matchFive(nameThree)).toBe(false);
    expect(matchFive(nameFour)).toBe(false);
  });
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
