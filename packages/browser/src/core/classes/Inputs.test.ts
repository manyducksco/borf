import test from "ava";
import { Readable, Writable } from "./Writable.js";
import { Inputs } from "./Inputs.js";

test("the basics", (t) => {
  const plain = "value";
  const $readOnly = new Readable(5);
  const $$writable = new Writable({ write: "this" });

  const inputs = new Inputs({
    plain,
    readOnly: $readOnly,
    writable: $$writable,
  });

  inputs.connect();

  t.deepEqual(inputs.api.get(), {
    plain: "value",
    readOnly: 5,
    writable: { write: "this" },
  });

  inputs.api.set("writable", { write: "that" });

  t.deepEqual(inputs.api.get("writable"), { write: "that" });
  t.deepEqual($$writable.value, { write: "that" });

  t.throws(() => {
    inputs.api.update((current) => {
      current.readOnly = 12;
      current.writable = {
        write: "other",
      };
    });
  });

  inputs.disconnect();
});
