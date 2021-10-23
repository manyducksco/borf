import { filter } from "./filter";
import { TestSource } from "../_test/TestSource";

test("forwards only values that match the condition", () => {
  const condition = (n: number) => n % 2 === 0;
  const sender = new TestSource(1);
  const filtered = filter(sender, condition);
  const fn = jest.fn();

  const receiver = filtered.receive();
  receiver.listen(fn);

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
