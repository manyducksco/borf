import { relay } from "./relay";
import { TestSender } from "./_test/TestSender";

test("creates a new receivable that forwards received values", () => {
  const sender = new TestSender<number>();
  const relayed = relay(sender.receive());
  const fn = jest.fn();

  sender.receive(fn);
  relayed.receive(fn);

  sender.send(2);

  expect(fn).toHaveBeenCalledTimes(2);
  expect(fn).toHaveBeenCalledWith(2);
});
