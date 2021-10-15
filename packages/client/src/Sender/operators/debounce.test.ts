import { debounce } from "./debounce";
import { TestSender } from "../_test/TestSender";

test("forwards only latest value after specified milliseconds", async () => {
  const sender = new TestSender<number>();
  const debounced = debounce(sender.receive(), 20);
  const fn = jest.fn();

  debounced.receive(fn);

  sender.send(39);
  sender.send(22);

  expect(fn).not.toHaveBeenCalled();

  await new Promise((resolve) => setTimeout(resolve, 25));

  expect(fn).toHaveBeenCalledTimes(1);
  expect(fn).toHaveBeenCalledWith(22);
  expect(fn).not.toHaveBeenCalledWith(39);
});
