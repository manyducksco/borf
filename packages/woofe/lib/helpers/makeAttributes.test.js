import { makeState } from "../../helpers/state.js";
import { makeDebug } from "../../helpers/makeDebug.js";
import { makeAttributes } from "./makeAttributes.js";

const debug = makeDebug({ filter: "*" });
const channel = debug.makeChannel("test");

test("the basics", () => {
  const plain = "value";
  const readOnly = makeState(5).readable();
  const writable = makeState({ write: "this" });

  const { controls, api } = makeAttributes(channel, { plain, readOnly, writable });

  controls.connect();

  expect(api.get()).toStrictEqual({
    plain: "value",
    readOnly: 5,
    writable: { write: "this" },
  });

  api.set("writable", { write: "that" });

  expect(api.get("writable")).toStrictEqual({ write: "that" });
  expect(writable.get()).toStrictEqual({ write: "that" });

  api.update((current) => {
    current.readOnly = 12;
    current.writable = {
      write: "other",
    };
  });

  api.setDefaults({
    plain: "default plain value",
    borf: "this is new",
  });

  expect(api.get("plain")).toBe("value");
  expect(api.get("borf")).toBe("this is new");

  controls.disconnect();
});
