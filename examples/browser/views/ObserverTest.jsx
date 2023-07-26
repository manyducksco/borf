import { cond, observe, Writable } from "@borf/browser";
import { ExampleFrame } from "./ExampleFrame";

export function ObserverTest(_, ctx) {
  const $$value1 = new Writable("one");
  const $$value2 = new Writable(2);
  const $$value3 = new Writable([1, 2, 3]);

  return (
    <ExampleFrame title="Observer Test">
      {observe($$value1, (value) => {
        return value;
      })}

      <hr />

      {observe([$$value1, $$value2, $$value3], (v1, v2, v3) => {
        return (
          <ul>
            <li>{v1}</li>
            <li>{v2}</li>
            <li>{v3}</li>
          </ul>
        );
      })}
    </ExampleFrame>
  );
}

function SubView({ value }) {
  return <li>{value}</li>;
}
