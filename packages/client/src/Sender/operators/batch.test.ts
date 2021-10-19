import { batch } from "./batch";
import { TestSender } from "../_test/TestSender";

test("batches a number of values into an array", async () => {
  const sender = new TestSender<number, number[]>(batch(5, 20));
  const fn = jest.fn();

  sender.receive(fn);

  sender.send(1);
  sender.send(2);
  sender.send(3);
  sender.send(4);
  sender.send(5);

  expect(fn).toHaveBeenCalledTimes(1);
  expect(fn).toHaveBeenCalledWith([1, 2, 3, 4, 5]);
});

test("sends array with fewer items if full count hasn't arrived before timeout", async () => {
  const sender = new TestSender<number, number[]>(batch(5, 20));
  const fn = jest.fn();

  sender.receive(fn);

  sender.send(1);
  sender.send(2);
  sender.send(3);

  await new Promise((resolve) => setTimeout(resolve, 25));

  expect(fn).toHaveBeenCalledTimes(1);
  expect(fn).toHaveBeenCalledWith([1, 2, 3]);
});
