import { makeTransitions, makeView } from "@woofjs/client";
import { animate } from "popmotion";
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
            disabled={ctx.readable("inputValue").as((v) => v.trim() === "")}
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

          return animated(<li onclick={onclick}>{$item}</li>);
        })}
      </div>
    </div>
  );
});

const animated = makeTransitions({
  in: function (ctx) {
    animate({
      from: { opacity: 0, x: -10 },
      to: { opacity: 1, x: 0 },
      duration: 300,
      onUpdate: function (latest) {
        ctx.node.style.opacity = latest.opacity;
        ctx.node.style.transform = `translateX(${latest.x}px)`;
      },
      onComplete: function () {
        ctx.done();
      },
    });
  },
  out: function (ctx) {
    animate({
      from: { opacity: 1, x: 0 },
      to: { opacity: 0, x: 10 },
      duration: 300,
      onUpdate: function (latest) {
        ctx.node.style.opacity = latest.opacity;
        ctx.node.style.transform = `translateX(${latest.x}px)`;
      },
      onComplete: function () {
        ctx.done();
      },
    });
  },
});
