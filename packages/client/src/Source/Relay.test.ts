import { Relay } from "./Relay";
import { TestSource } from "./_test/TestSource";

test("relays values through an operator function", () => {
  const source = new TestSource(1);
  const relay = new Relay(source, (value, send) => {
    send(value * 2);
  });

  const fn = jest.fn();
  const receiver = relay.receive();
  receiver.listen(fn);

  source.send(2);

  expect(fn).toHaveBeenCalledWith(4);

  source.send(500);

  expect(fn).toHaveBeenCalledWith(1000);
  expect(fn).toHaveBeenCalledTimes(2);
});
