import { makeState } from "../../helpers/state.js";
import { Attributes } from "./Attributes.js";

test("the basics", () => {
  const plain = "value";
  const readOnly = makeState(5).readable();
  const writable = makeState({ write: "this" });

  const attributes = new Attributes({ attributes: { plain, readOnly, writable } });
  const api = attributes.api;

  attributes.connect();

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

  attributes.disconnect();
});
