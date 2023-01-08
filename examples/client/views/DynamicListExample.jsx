import { h, makeTransitions, makeView, makeState } from "@woofjs/client";
import { animate } from "popmotion";
import logLifecycle from "../utils/logLifecycle.js";

const initialList = ["apple", "banana", "potato", "fried chicken"];

export const DynamicListExample = makeView((ctx) => {
  ctx.name = "DynamicListExample";

  const $$shoppingList = makeState(initialList);
  const $$inputValue = makeState("");

  logLifecycle(ctx);

  const getSorted = () => {
    return $$shoppingList
      .get()
      .map((x) => x)
      .sort();
  };

  const reset = () => {
    $$shoppingList.set(initialList);
  };

  return (
    <div class="example">
      <h3>
        Dynamic Lists with <code>repeat()</code>
      </h3>

      <div>
        <button
          onclick={() => {
            $$shoppingList.set(getSorted());
          }}
        >
          Sort A to Z
        </button>
        <button
          onclick={() => {
            $$shoppingList.set(getSorted().reverse());
          }}
        >
          Sort Z to A
        </button>
        <div class="flex-center">
          <input type="text" value={$$inputValue} />
          <button
            disabled={$$inputValue.as((v) => v.trim() === "")}
            onclick={() => {
              // Add the current input value to the list and clear it.
              $$shoppingList.update((current) => {
                current.push($$inputValue.get());
              });
              $$inputValue.set("");
            }}
          >
            Add Item
          </button>
          <button onclick={reset}>Reset List</button>
        </div>

        {h.repeat($$shoppingList, ($item) => {
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
  enter(ctx) {
    animate({
      from: { opacity: 0, x: -10 },
      to: { opacity: 1, x: 0 },
      duration: 300,
      onUpdate(latest) {
        ctx.node.style.opacity = latest.opacity;
        ctx.node.style.transform = `translateX(${latest.x}px)`;
      },
      onComplete() {
        ctx.done();
      },
    });
  },
  exit(ctx) {
    animate({
      from: { opacity: 1, x: 0 },
      to: { opacity: 0, x: 10 },
      duration: 300,
      onUpdate(latest) {
        ctx.node.style.opacity = latest.opacity;
        ctx.node.style.transform = `translateX(${latest.x}px)`;
      },
      onComplete() {
        ctx.done();
      },
    });
  },
});
