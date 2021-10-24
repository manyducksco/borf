import { TestSource } from "./_test/TestSource";

describe("current", () => {
  test("returns current value", () => {
    const source = new TestSource(1);

    expect(source.current).toBe(1);
    source.send(2);
    expect(source.current).toBe(2);
  });
});

describe("broadcast and listen", () => {
  test("'listen' function listens for broadcasted values until cancelled", () => {
    const source = new TestSource(5);

    const callbackOne = jest.fn();
    const callbackTwo = jest.fn();

    const cancelOne = source.listen(callbackOne);
    const cancelTwo = source.listen(callbackTwo);

    source.broadcast();

    expect(callbackOne).toHaveBeenCalledTimes(1);
    expect(callbackOne).toHaveBeenCalledWith(5);
    expect(callbackTwo).toHaveBeenCalledTimes(1);
    expect(callbackTwo).toHaveBeenCalledWith(5);

    cancelOne();

    source.send(10);

    expect(callbackOne).toHaveBeenCalledTimes(1);
    expect(callbackOne).not.toHaveBeenCalledWith(10);
    expect(callbackTwo).toHaveBeenCalledTimes(2);
    expect(callbackTwo).toHaveBeenCalledWith(10);

    cancelTwo();

    source.send(15);

    expect(callbackOne).toHaveBeenCalledTimes(1);
    expect(callbackOne).not.toHaveBeenCalledWith(15);
    expect(callbackTwo).toHaveBeenCalledTimes(2);
    expect(callbackTwo).not.toHaveBeenCalledWith(15);
  });
});
