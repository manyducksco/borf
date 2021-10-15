import { TestSender } from "./TestSender";

test("sends events to receivers", () => {
  const sender = new TestSender<string>();
  const fn = jest.fn();

  sender.receive(fn);

  sender.send("hello");

  expect(fn).toHaveBeenCalledTimes(1);
  expect(fn).toHaveBeenCalledWith("hello");
});
