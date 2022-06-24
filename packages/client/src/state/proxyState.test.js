import { makeState } from "./makeState";
import { proxyState } from "./proxyState";

test("can .proxy() to  adopt the value of another state", () => {
  const $state1 = makeState(1);
  const $state2 = makeState("another");

  const $proxy = proxyState($state1);

  expect($proxy.get()).toBe(1);

  $proxy.set(5);
  $proxy.proxy($state2);

  expect($state1.get()).toBe(5);
  expect($proxy.get()).toBe("another");
});

test("watching and setting on the proxy and originals functions as expected", () => {
  const $state1 = makeState(1);
  const $state2 = makeState("another");

  const $proxy = proxyState($state1);

  const cancel = $proxy.watch((value) => {
    expect(value).toBe(3);
  });

  $state1.set(3);
  cancel();

  $proxy.proxy($state2);
  $state2.watch((value) => {
    expect(value).toBe("ANOTHER");
  });

  expect($proxy.get()).toBe("another");

  $proxy.set("ANOTHER");
});
