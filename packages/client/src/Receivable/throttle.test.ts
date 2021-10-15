import { throttle } from "./throttle";
import { TestSender } from "./_test/TestSender";

test("ignores all values for X milliseconds after sending", async () => {
  const sender = new TestSender<number>();
  const debounced = throttle(sender.receive(), 20);
  const fn = jest.fn();

  debounced.receive(fn);

  sender.send(39); // received
  sender.send(22); // ignored

  await new Promise((resolve) => setTimeout(resolve, 15));

  sender.send(15); // ignored

  await new Promise((resolve) => setTimeout(resolve, 15));

  sender.send(12); // received

  await new Promise((resolve) => setTimeout(resolve, 15));

  sender.send(5); // ignored

  expect(fn).toHaveBeenCalledTimes(2);
  expect(fn).toHaveBeenCalledWith(39);
  expect(fn).not.toHaveBeenCalledWith(22);
  expect(fn).not.toHaveBeenCalledWith(15);
  expect(fn).toHaveBeenCalledWith(12);
  expect(fn).not.toHaveBeenCalledWith(5);
});
