import { makeView, makeState, makeLocal } from "@woofjs/client";
import logLifecycle from "../utils/logLifecycle.js";

export const LocalsExample = makeView({
  name: "LocalsExample",
  setup: (ctx) => {
    logLifecycle(ctx);

    return (
      <div class="example">
        <h3>Scoped state with locals.</h3>
        <div>
          <ExampleLocal as="example" initialValue="Instance 1">
            <ValueDisplay />

            {/* Should override for subviews */}
            <ExampleLocal as="example" initialValue="Instance 2">
              <ValueDisplay />
            </ExampleLocal>
          </ExampleLocal>
        </div>
      </div>
    );
  },
});

const ExampleLocal = makeLocal({
  attributes: {
    initialValue: {
      type: "string",
      default: "DEFAULT",
    },
  },
  setup: (ctx) => {
    return {
      $$value: makeState(ctx.attributes.get("initialValue")),
    };
  },
});

const ValueDisplay = makeView((ctx) => {
  const { $$value } = ctx.local("example");

  return <span>{$$value}</span>;
});
