import { filter } from "./filter";
import { TestSender } from "../_test/TestSender";

test("forwards only values that match the condition", () => {
  const condition = (n: number) => n % 2 === 0;
  const sender = new TestSender<number>(filter(condition));
  const fn = jest.fn();

  sender.receive(fn);

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
