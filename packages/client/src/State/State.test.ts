import { MappedValue, State, StateBinding, StateSubscription } from "./State";

interface StateType {
  message: string;
}

describe("constructor", () => {
  test("sets initial state", () => {
    const state = new State<StateType>({
      message: "test",
    });

    expect(state.current).toStrictEqual({
      message: "test",
    });
  });
});

describe("immutability", () => {
  test("current state is immutable", () => {
    const state = new State<StateType>({
      message: "test",
    });

    expect(() => {
      state.current.message = "can't touch this";
    }).toThrowError(/cannot assign to read only property/i);
  });

  test("history array is immutable", () => {
    const state = new State<StateType>({
      message: "test",
    });

    expect(() => {
      state.history.push({ message: "can't touch this" });
    }).toThrowError(/object is not extensible/i);
  });
});

describe("set", () => {
  test("adds a new state", () => {
    const state = new State<StateType>({
      message: "test",
    });
    expect(state.current.message).toBe("test");

    state.set("message", "changed");
    expect(state.current.message).toBe("changed");

    state.set({ message: "changed again" });
    expect(state.current.message).toBe("changed again");
  });
});

describe("undo/redo", () => {
  test("undo and redo step backward and forward in state history", () => {
    const state = new State<StateType>({
      message: "initial",
    });
    expect(state.current.message).toBe("initial");

    state.set("message", "changed");
    expect(state.current.message).toBe("changed");

    state.set("message", "changed again");
    expect(state.current.message).toBe("changed again");

    state.undo(); // step back by one
    expect(state.current.message).toBe("changed");

    state.redo(); // step forward by one
    expect(state.current.message).toBe("changed again");

    state.undo(2); // step back by two
    expect(state.current.message).toBe("initial");

    state.undo(500);
    expect(state.current.message).toBe("initial"); // stops at beginning of history

    state.redo(2); // step forward by two
    expect(state.current.message).toBe("changed again");

    state.redo(500);
    expect(state.current.message).toBe("changed again"); // stops at end of history
  });

  test("setting state after undo truncates all 'future' states and inserts at current index", () => {
    const state = new State<StateType>({
      message: "1",
    });

    state.set("message", "2");
    state.set("message", "3");
    state.undo();
    state.set("message", "4");

    expect(state.history).toStrictEqual([
      { message: "1" },
      { message: "2" },
      { message: "4" },
    ]);
  });
});

describe("subscribe", () => {
  test("returns a StateSubscription", () => {
    const state = new State<StateType>({
      message: "initial",
    });
    const sub = state.subscribe("message");

    expect(sub instanceof StateSubscription).toBe(true);
  });

  test("subscription receiver is called with new value when it changes", () => {
    const receiver = jest.fn();

    const state = new State<StateType>({
      message: "initial",
    });

    // set by property
    const sub1 = state.subscribe("message");
    sub1.receiver = receiver;

    // set with subscribe function
    const sub2 = state.subscribe("message", receiver);

    state.set("message", "changed");

    expect(receiver).toHaveBeenCalledTimes(2);
    expect(receiver).toHaveBeenCalledWith("changed");
  });

  test("subscription receives no changes when active=false", () => {
    const receiver = jest.fn();

    const state = new State<StateType>({
      message: "initial",
    });

    const sub = state.subscribe("message", receiver);

    sub.active = false;
    state.set("message", "changed");
    expect(receiver).not.toHaveBeenCalled();

    sub.active = true;
    state.set("message", "changed again");
    expect(receiver).toHaveBeenCalledTimes(1);
    expect(receiver).toHaveBeenLastCalledWith("changed again");
  });

  test("subscription receives no changes after being cancelled", () => {
    const receiver = jest.fn();

    const state = new State<StateType>({
      message: "initial",
    });

    const sub = state.subscribe("message", receiver);

    state.set("message", "changed");
    expect(receiver).toHaveBeenCalledTimes(1);
    expect(receiver).toHaveBeenLastCalledWith("changed");

    sub.cancel();
    state.set("message", "ignore this");
    expect(receiver).toHaveBeenCalledTimes(1);
    expect(receiver).toHaveBeenLastCalledWith("changed");
  });
});

describe("bind", () => {
  test("returns a StateBinding", () => {
    const state = new State<StateType>({
      message: "initial",
    });
    const sub = state.bind("message");

    expect(sub instanceof StateBinding).toBe(true);
  });

  test("set updates value of bound key in original state", () => {
    const receiver = jest.fn();

    const state = new State<StateType>({
      message: "initial",
    });
    const binding = state.bind("message", receiver);

    binding.set("changed");

    expect(state.current.message).toBe("changed");
    expect(receiver).toHaveBeenCalledWith("changed");
  });
});

describe("map", () => {
  test("returns a MappedValue", () => {
    const state = new State({
      firstName: "Dave",
      lastName: "Jones",
    });

    const fullName = state.map(
      ["firstName", "lastName"],
      (first, last) => `${first} ${last}`
    );
    expect(fullName instanceof MappedValue).toBe(true);
  });

  test("starts with initial computed value", () => {
    const state = new State({
      firstName: "Dave",
      lastName: "Jones",
    });

    const fullName = state.map(
      ["firstName", "lastName"],
      (first, last) => `${first} ${last}`
    );
    expect(fullName.current).toBe("Dave Jones");
  });

  test("updates when dependent keys get new values", () => {
    const state = new State({
      firstName: "Dave",
      lastName: "Jones",
    });

    const fullName = state.map(
      ["firstName", "lastName"],
      (first, last) => `${first} ${last}`
    );
    expect(fullName.current).toBe("Dave Jones");

    state.set("lastName", "Bones");
    expect(fullName.current).toBe("Dave Bones");
  });

  test("can subscribe to new values and cancel subscription", () => {
    const state = new State({
      firstName: "Dave",
      lastName: "Jones",
    });

    const fullName = state.map(
      ["firstName", "lastName"],
      (first, last) => `${first} ${last}`
    );

    const receiver = jest.fn();

    const sub = fullName.subscribe(receiver);

    state.set("lastName", "Bones");

    expect(receiver).toHaveBeenCalledWith("Dave Bones");
    expect(sub.current).toBe("Dave Bones");

    sub.cancel();

    state.set("lastName", "Drones");

    expect(receiver).toHaveBeenLastCalledWith("Dave Bones");
    expect(sub.current).toBe("Dave Bones");
    expect(fullName.current).toBe("Dave Drones");
  });
});

describe("options", () => {
  test("history is limited to 'undoLimit' items", () => {
    const state = new State<StateType>(
      {
        message: "1",
      },
      {
        undoLimit: 3,
      }
    );

    state.set("message", "2");
    expect(state.current.message).toBe("2");
    state.set("message", "3");
    expect(state.current.message).toBe("3");

    expect(state.history).toStrictEqual([
      { message: "1" },
      { message: "2" },
      { message: "3" },
    ]);

    state.set("message", "4");
    expect(state.current.message).toBe("4");
    state.set("message", "5");
    expect(state.current.message).toBe("5");

    expect(state.history).toStrictEqual([
      { message: "3" },
      { message: "4" },
      { message: "5" },
    ]);
  });
});
