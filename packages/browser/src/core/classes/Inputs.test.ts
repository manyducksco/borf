import { Readable, Writable } from "./Writable.js";
import { Inputs } from "./Inputs.js";

test("the basics", () => {
  const plain = "value";
  const readOnly = new Readable(5);
  const writable = new Writable({ write: "this" });

  const inputs = new Inputs({ inputs: { plain, readOnly, writable } });

  inputs.connect();

  expect(inputs.api.get()).toStrictEqual({
    plain: "value",
    readOnly: 5,
    writable: { write: "this" },
  });

  inputs.api.set("writable", { write: "that" });

  expect(inputs.api.get("writable")).toStrictEqual({ write: "that" });
  expect(writable.value).toStrictEqual({ write: "that" });

  expect(() => {
    inputs.api.update((current) => {
      current.readOnly = 12;
      current.writable = {
        write: "other",
      };
    });
  }).toThrowError(/Tried to set value of read-only binding/);

  inputs.disconnect();
});
