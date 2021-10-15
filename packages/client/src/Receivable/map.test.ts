import { map } from "./map";
import { TestSender } from "./_test/TestSender";

test("transforms received values", () => {
  const sender = new TestSender<number>();
  const mapped = map(sender.receive(), (n) => n * 2);
  const fn = jest.fn();

  mapped.receive(fn);

  sender.send(2);
  sender.send(600);

  expect(fn).toHaveBeenCalledTimes(2);
  expect(fn).toHaveBeenCalledWith(4);
  expect(fn).toHaveBeenCalledWith(1200);
});
