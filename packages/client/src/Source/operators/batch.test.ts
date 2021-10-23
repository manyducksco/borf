import { batch } from "./batch";
import { TestSource } from "../_test/TestSource";

test("batches a number of values into an array", async () => {
  const source = new TestSource(0);
  const batched = batch(source, 5, 20);
  const fn = jest.fn();

  const receiver = batched.receive();
  receiver.listen(fn);

  source.send(1);
  source.send(2);
  source.send(3);
  source.send(4);
  source.send(5);

  expect(fn).toHaveBeenCalledTimes(1);
  expect(fn).toHaveBeenCalledWith([1, 2, 3, 4, 5]);
});

test("sends array with fewer items if full count hasn't arrived before wait time", async () => {
  const source = new TestSource(0);
  const batched = batch(source, 5, 20);
  const fn = jest.fn();

  const receiver = batched.receive();
  receiver.listen(fn);

  source.send(1);
  source.send(2);
  source.send(3);

  await new Promise((resolve) => setTimeout(resolve, 25));

  expect(fn).toHaveBeenCalledTimes(1);
  expect(fn).toHaveBeenCalledWith([1, 2, 3]);
});
