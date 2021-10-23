import { State } from "./State";

describe("set", () => {
  test("updates value and broadcasts if it has changed", () => {
    const state = new State("initial");
    const receiver = state.receive();
    const fn = jest.fn();

    receiver.listen(fn);

    expect(state.current).toBe("initial");
    expect(receiver.pull()).toBe("initial");

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
    const receiver = state.receive();
    const binding = state.bind();
    const bindCallback = jest.fn();
    const receiveCallback = jest.fn();

    binding.listen(bindCallback);
    receiver.listen(receiveCallback);

    expect(binding.pull()).toBe("initial");
    expect(receiver.pull()).toBe("initial");

    binding.set("updated");

    expect(binding.pull()).toBe("updated");
    expect(bindCallback).toHaveBeenCalledTimes(1);
    expect(bindCallback).toHaveBeenCalledWith("updated");

    expect(receiver.pull()).toBe("updated");
    expect(receiveCallback).toHaveBeenCalledTimes(1);
    expect(receiveCallback).toHaveBeenCalledWith("updated");
  });
});
