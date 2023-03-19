import { View, makeState, makeSpring } from "@borf/browser";
import logLifecycle from "../utils/logLifecycle.js";

const initialList = ["apple", "banana", "potato", "fried chicken"];

export class DynamicListExample extends View {
  setup(ctx, { repeat }) {
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
              disabled={$$inputValue.map((v) => v.trim() === "")}
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

          {repeat($$shoppingList, ($item) => {
            return <Item value={$item} />;
          })}
        </div>
      </div>
    );
  }
}

class Item extends View {
  setup(ctx) {
    const opacity = makeSpring(0);
    const x = makeSpring(-10);

    ctx.animateIn(() => Promise.all([opacity.to(1), x.to(0)]));
    ctx.animateOut(() => Promise.all([opacity.to(0), x.to(-10)]));

    const $value = ctx.inputs.readable("value");

    const onclick = () => {
      alert($value.get());
    };

    return (
      <li
        style={{ opacity, transform: x.map((x) => `translateX(${x}px)`) }}
        onclick={onclick}
      >
        {$value}
      </li>
    );
  }
}
