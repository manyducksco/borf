import { makeDebounce } from "./_makeDebounce.js";

const sleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

describe("called with timeout only", () => {
  test("creates a debounce function that takes and queues another", async () => {
    const debounce = makeDebounce(30);
    let done = jest.fn();

    debounce(done);
    debounce(done);
    debounce(done);

    expect(done.mock.calls.length).toBe(0);
    await sleep(40);
    expect(done.mock.calls.length).toBe(1);
  });
});

describe("called with timeout and callback", () => {
  test("creates a debounce function that queues the callback", async () => {
    let done = jest.fn();
    const debounce = makeDebounce(30, done);

    debounce();
    debounce();
    debounce();

    expect(done.mock.calls.length).toBe(0);
    await sleep(40);
    expect(done.mock.calls.length).toBe(1);
  });
});

describe("called with config object", () => {
  test("creates a debounce function that takes and queues another when called without a callback", async () => {
    const debounce = makeDebounce({
      timeout: 30,
    });
    let done = jest.fn();

    debounce(done);
    debounce(done);
    debounce(done);

    expect(done.mock.calls.length).toBe(0);
    await sleep(40);
    expect(done.mock.calls.length).toBe(1);
  });

  test("creates a debounce function that queues the callback when called with a callback", async () => {
    let done = jest.fn();
    const debounce = makeDebounce({
      timeout: 30,
      callback: done,
    });

    debounce();
    debounce();
    debounce();

    expect(done.mock.calls.length).toBe(0);
    await sleep(40);
    expect(done.mock.calls.length).toBe(1);
  });

  test("immediate causes callback to fire right away", async () => {
    let done = jest.fn();
    const debounce = makeDebounce({
      timeout: 30,
      immediate: true,
      callback: done,
    });

    debounce();
    debounce();
    debounce();
    debounce();
    debounce();

    expect(done.mock.calls.length).toBe(1);
    await sleep(40);
    expect(done.mock.calls.length).toBe(2);
  });
});
