import { throttle } from "./throttle";
import { TestSource } from "../_test/TestSource";

// TODO: Fix this test sometimes receiving a third value and failing because of test processing times
test("ignores all values for 'wait' milliseconds after sending", async () => {
  const source = new TestSource(1);
  const throttled = throttle(source, 20);
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
