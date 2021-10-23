import { debounce } from "./debounce";
import { TestSource } from "../_test/TestSource";

test("forwards only latest value after specified milliseconds", async () => {
  const source = new TestSource(0);
  const debounced = debounce(source, 10);
  const fn = jest.fn();

  const receiver = debounced.receive();
  receiver.listen(fn);

  source.send(39);
  source.send(22);

  expect(fn).not.toHaveBeenCalled();

  await new Promise((resolve) => setTimeout(resolve, 20));

  expect(fn).toHaveBeenCalledTimes(1);
  expect(fn).toHaveBeenCalledWith(22);
  expect(fn).not.toHaveBeenCalledWith(39);
});

test("forwards immediately if immediate is true and not awaiting timeout", async () => {
  const source = new TestSource(0);
  const debounced = debounce(source, 10, true);
  const fn = jest.fn();

  const receiver = debounced.receive();
  receiver.listen(fn);

  source.send(39);
  source.send(22);

  expect(fn).toHaveBeenCalledTimes(1);
  expect(fn).toHaveBeenCalledWith(39);

  await new Promise((resolve) => setTimeout(resolve, 20));

  expect(fn).toHaveBeenCalledTimes(2);
  expect(fn).toHaveBeenCalledWith(22);
  expect(fn).toHaveBeenCalledWith(39);
});
