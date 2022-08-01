import { makeState } from "./makeState";
import { makeProxyState } from "./makeProxyState";

test("can .proxy() to  adopt the value of another state", () => {
  const $state1 = makeState(1);
  const $state2 = makeState("another");

  const $proxy = makeProxyState($state1);

  expect($proxy.get()).toBe(1);

  $proxy.set(5);
  $proxy.proxy($state2);

  expect($state1.get()).toBe(5);
  expect($proxy.get()).toBe("another");
});

test("watching and setting on the proxy and originals functions as expected", () => {
  const $state1 = makeState(1);
  const $state2 = makeState("another");

  const $proxy = makeProxyState($state1);

  const next = jest.fn();

  const subscription = $proxy.subscribe({
    next,
  });

  expect(next).toHaveBeenCalledTimes(1);
  expect(next).toHaveBeenCalledWith(1);

  $state1.set(3);

  expect(next).toHaveBeenCalledTimes(2);
  expect(next).toHaveBeenCalledWith(3);

  subscription.unsubscribe();

  $proxy.proxy($state2);

  expect($proxy.get()).toBe("another");
  expect(next).toHaveBeenCalledTimes(2);
  expect(next).not.toHaveBeenCalledWith("another");

  const resubscription = $proxy.subscribe(next);

  expect(next).toHaveBeenCalledTimes(3);
  expect(next).toHaveBeenCalledWith("another");

  $proxy.set("ANOTHER!");

  expect($state2.get()).toBe("ANOTHER!");
  expect(next).toHaveBeenCalledTimes(4);
  expect(next).toHaveBeenCalledWith("ANOTHER!");
});

test("is Observable", () => {
  const $state = makeState(1);
  const $state2 = makeState("two");

  const $proxy = makeProxyState($state);

  const next = jest.fn();

  const subscription = $proxy.subscribe({
    next,
  });

  $proxy.set(2);
  $proxy.set(3);
  $proxy.set(4);
  $proxy.proxy($state2);

  subscription.unsubscribe();

  $proxy.set(5);

  expect(next).toHaveBeenCalledTimes(5);
  expect(next).toHaveBeenCalledWith(1);
  expect(next).toHaveBeenCalledWith(2);
  expect(next).toHaveBeenCalledWith(3);
  expect(next).toHaveBeenCalledWith(4);
  expect(next).toHaveBeenCalledWith("two");
  expect(next).not.toHaveBeenCalledWith(5);
});
