import { State } from "./State";

describe("set", () => {
  test("updates value and broadcasts if it has changed", () => {
    const state = new State("initial");
    const fn = jest.fn();

    state.listen(fn);

    expect(state.current).toBe("initial");

    state.set("updated");

    expect(fn).toHaveBeenCalledWith("updated");
    expect(fn).toHaveBeenCalledTimes(1);

    state.set("updated"); // same value shouldn't broadcast

    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe("bind", () => {
  test("updates value when 'set' function is called", () => {
    const state = new State("initial");
    const binding = state.bind();
    const bindCallback = jest.fn();
    const listenCallback = jest.fn();

    binding.listen(bindCallback);
    state.listen(listenCallback);

    expect(binding.get()).toBe("initial");
    expect(state.current).toBe("initial");

    binding.set("updated");

    expect(binding.get()).toBe("updated");
    expect(bindCallback).toHaveBeenCalledTimes(1);
    expect(bindCallback).toHaveBeenCalledWith("updated");

    expect(state.current).toBe("updated");
    expect(listenCallback).toHaveBeenCalledTimes(1);
    expect(listenCallback).toHaveBeenCalledWith("updated");
  });
});
