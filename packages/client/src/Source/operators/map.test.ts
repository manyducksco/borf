import { map } from "./map";
import { TestSource } from "../_test/TestSource";

test("transforms received values", () => {
  const source = new TestSource(1);
  const mapped = map(source, (n) => n * 2);
  const fn = jest.fn();

  const receiver = mapped.receive();
  receiver.listen(fn);

  expect(receiver.pull()).toBe(2);

  source.send(2);
  source.send(600);

  expect(fn).toHaveBeenCalledTimes(2);
  expect(fn).toHaveBeenCalledWith(4);
  expect(fn).toHaveBeenCalledWith(1200);
});
