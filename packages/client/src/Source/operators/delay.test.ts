import { delay } from "./delay";
import { TestSource } from "../_test/TestSource";

test("forwards only latest value after specified milliseconds", async () => {
  const source = new TestSource(0);
  const delayed = delay(source, 20);
  const fn = jest.fn();

  delayed.listen(fn);

  source.send(39);
  source.send(22);

  expect(fn).not.toHaveBeenCalled();

  await new Promise((resolve) => setTimeout(resolve, 25));

  expect(fn).toHaveBeenCalledTimes(2);
  expect(fn).toHaveBeenCalledWith(22);
  expect(fn).toHaveBeenCalledWith(39);
});
