import { Pipe, PipeReceiver } from "./Pipe";

describe("send and receive", () => {
  test("receive returns a PipeReceiver", () => {
    const pipe = new Pipe();

    expect(pipe.receive() instanceof PipeReceiver).toBe(true);
  });

  test("sends and receives messages", () => {
    const pipe = new Pipe<string>();

    pipe.receive((value) => {
      expect(value).toBe("it works");
    });

    pipe.send("it works");
  });

  test("receivers can reply", () => {
    const pipe = new Pipe<string, string>();

    pipe.receive((value, reply) => {
      expect(value).toBe("it works");
      reply("that's nice");
    });

    pipe.send("it works", (response) => {
      expect(response).toBe("that's nice");
    });
  });

  test("receivers can be deactivated and cancelled", () => {
    const pipe = new Pipe<number>();

    let lastNumber = 0;

    const receiver = pipe.receive((value) => {
      lastNumber = value;
    });

    pipe.send(1);
    expect(lastNumber).toBe(1);

    receiver.active = false;

    pipe.send(2);
    expect(lastNumber).toBe(1);

    receiver.active = true;

    pipe.send(3);
    expect(lastNumber).toBe(3);

    receiver.cancel();

    pipe.send(4);
    expect(lastNumber).toBe(3);
  });
});
