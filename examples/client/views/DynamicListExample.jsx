import { makeView } from "@woofjs/client";
import logLifecycle from "../utils/logLifecycle.js";

const initialList = ["apple", "banana", "potato", "fried chicken"];

export const DynamicListExample = makeView((ctx) => {
  ctx.name = "DynamicListExample";
  ctx.defaultState = {
    shoppingList: initialList,
    inputValue: "",
  };

  logLifecycle(ctx);

  const getSorted = () => {
    return ctx
      .get("shoppingList")
      .map((x) => x)
      .sort();
  };

  const reset = () => {
    ctx.set("shoppingList", initialList);
  };

  return (
    <div class="example">
      <h3>
        Dynamic Lists with <code>repeat()</code>
      </h3>

      <div>
        <button
          onclick={() => {
            ctx.set("shoppingList", getSorted());
          }}
        >
          Sort A to Z
        </button>
        <button
          onclick={() => {
            ctx.set("shoppingList", getSorted().reverse());
          }}
        >
          Sort Z to A
        </button>
        <div class="flex-center">
          <input type="text" value={ctx.writable("inputValue")} />
          <button
            disabled={ctx.readable("inputValue").to((v) => v.trim() == "")}
            onclick={() => {
              // Add the current input value to the list and clear it.
              const inputValue = ctx.get("inputValue");
              ctx.set("shoppingList", (current) => {
                current.push(inputValue);
              });
              ctx.set("inputValue", "");
            }}
          >
            Add Item
          </button>
          <button onclick={reset}>Reset List</button>
        </div>

        {ctx.repeat("shoppingList", ($item) => {
          const onclick = () => {
            alert($item.get());
          };

          return <li onclick={onclick}>{$item}</li>;
        })}
      </div>
    </div>
  );
});
