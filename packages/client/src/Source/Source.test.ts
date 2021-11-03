import { Relay } from "./Source";
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

describe("map", () => {
  test("transforms received values", () => {
    const source = new TestSource(1);
    const mapped = source.map((n) => n * 2);
    const fn = jest.fn();

    mapped.listen(fn);

    expect(mapped.current).toBe(2);

    source.send(2);
    source.send(600);

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenCalledWith(4);
    expect(fn).toHaveBeenCalledWith(1200);
  });
});

describe("filter", () => {
  test("forwards only values that meet the condition", () => {
    const source = new TestSource(1);
    const filtered = source.filter((n: number) => n % 2 === 0);
    const fn = jest.fn();

    filtered.listen(fn);

    source.send(2);
    source.send(3);
    source.send(4);
    source.send(5);
    source.send(6);

    expect(fn).toHaveBeenCalledTimes(3);

    expect(fn).toHaveBeenCalledWith(2);
    expect(fn).not.toHaveBeenCalledWith(3);
    expect(fn).toHaveBeenCalledWith(4);
    expect(fn).not.toHaveBeenCalledWith(5);
    expect(fn).toHaveBeenCalledWith(6);
  });
});

describe("delay", () => {
  test("forwards only latest value after specified milliseconds", async () => {
    const source = new TestSource(0);
    const delayed = source.delay(20);
    const fn = jest.fn();

    delayed.listen(fn);

    source.send(39);
    source.send(22);

    expect(fn).not.toHaveBeenCalled();

    await new Promise((resolve) => setTimeout(resolve, 25));

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenCalledWith(22);
    expect(fn).toHaveBeenCalledWith(39);
  });
});

describe("debounce", () => {
  test("forwards only latest value after specified milliseconds", async () => {
    const source = new TestSource(0);
    const debounced = source.debounce(10);
    const fn = jest.fn();

    debounced.listen(fn);

    source.send(39);
    source.send(22);

    expect(fn).not.toHaveBeenCalled();

    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(22);
    expect(fn).not.toHaveBeenCalledWith(39);
  });

  test("forwards immediately if immediate is true and not awaiting timeout", async () => {
    const source = new TestSource(0);
    const debounced = source.debounce(10, true);
    const fn = jest.fn();

    debounced.listen(fn);

    source.send(39);
    source.send(22);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(39);

    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenCalledWith(22);
    expect(fn).toHaveBeenCalledWith(39);
  });
});

describe("throttle", () => {
  // TODO: Fix this test sometimes receiving a third value and failing because of test processing times
  test("ignores all values for 'wait' milliseconds after sending", async () => {
    const source = new TestSource(1);
    const throttled = source.throttle(20);
    const fn = jest.fn();

    throttled.listen(fn);

    source.send(39); // received
    source.send(22); // ignored (+20ms remaining)

    await new Promise((resolve) => setTimeout(resolve, 5));

    source.send(15); // ignored (+15ms remaining)

    await new Promise((resolve) => setTimeout(resolve, 20));

    source.send(12); // received

    await new Promise((resolve) => setTimeout(resolve, 5));

    source.send(5); // ignored (+15ms remaining)

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenCalledWith(39);
    expect(fn).not.toHaveBeenCalledWith(22);
    expect(fn).not.toHaveBeenCalledWith(15);
    expect(fn).toHaveBeenCalledWith(12);
    expect(fn).not.toHaveBeenCalledWith(5);
  });
});

describe("batch", () => {
  test("batches a number of values into an array", async () => {
    const source = new TestSource(0);
    const batched = source.batch(5, 20);
    const fn = jest.fn();

    batched.listen(fn);

    source.send(1);
    source.send(2);
    source.send(3);
    source.send(4);
    source.send(5);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith([0, 1, 2, 3, 4]);
  });

  test("sends array with fewer items if full count hasn't arrived before wait time", async () => {
    const source = new TestSource(0);
    const batched = source.batch(5, 20);
    const fn = jest.fn();

    batched.listen(fn);

    source.send(1);
    source.send(2);
    source.send(3);

    await new Promise((resolve) => setTimeout(resolve, 25));

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith([0, 1, 2, 3]);
  });
});

describe("Relay", () => {
  test("relays values through an operator function", () => {
    const source = new TestSource(1);
    const relay = new Relay(source, (value, send) => {
      send(value * 2);
    });

    const fn = jest.fn();

    relay.listen(fn);

    source.send(2);

    expect(fn).toHaveBeenCalledWith(4);

    source.send(500);

    expect(fn).toHaveBeenCalledWith(1000);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
