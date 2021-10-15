import { filter } from "./filter";
import { TestSender } from "../_test/TestSender";

test("forwards only values that match the condition", () => {
  const sender = new TestSender<number>();
  const evens = filter(sender.receive(), (n) => n % 2 === 0);
  const fn = jest.fn();

  evens.receive(fn);

  sender.send(2);
  sender.send(3);
  sender.send(4);
  sender.send(5);
  sender.send(6);

  expect(fn).toHaveBeenCalledTimes(3);

  expect(fn).toHaveBeenCalledWith(2);
  expect(fn).not.toHaveBeenCalledWith(3);
  expect(fn).toHaveBeenCalledWith(4);
  expect(fn).not.toHaveBeenCalledWith(5);
  expect(fn).toHaveBeenCalledWith(6);
});
