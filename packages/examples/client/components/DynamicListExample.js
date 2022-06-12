import { v, each, makeState } from "@woofjs/client";
import logLifecycle from "../utils/logLifecycle.js";

function DynamicListExample($attrs, self) {
  self.debug.name = "DynamicListExample";

  logLifecycle(self);

  const initialList = ["apple", "banana", "potato", "fried chicken"];

  const $shoppingList = makeState(initialList);
  const $inputValue = makeState("");

  const getSorted = () => {
    return $shoppingList
      .get()
      .map((x) => x)
      .sort();
  };

  const reset = () => {
    $shoppingList.set(initialList);
  };

  return (
    <div class="example">
      <h3>
        Dynamic Lists with <code>each()</code>
      </h3>

      <div>
        <button
          onclick={() => {
            $shoppingList.set(getSorted());
          }}
        >
          Sort A to Z
        </button>

        <button
          onclick={() => {
            $shoppingList.set(getSorted().reverse());
          }}
        >
          Sort Z to A
        </button>

        <div class="flex-center">
          <input
            type="text"
            value={$inputValue}
            oninput={(e) => {
              $inputValue.set(e.target.value);
            }}
          />
          <button
            disabled={$inputValue.map((current) => current.trim() == "")}
            onclick={() => {
              // Add the current input value to the list and clear it.
              $shoppingList.set((current) => {
                current.push($inputValue.get());
              });
              $inputValue.set("");
            }}
          >
            Add Item
          </button>
          <button onclick={reset}>Reset List</button>
        </div>

        {each($shoppingList, ($attrs, self) => {
          const $item = $attrs.map("@value");

          self.key = $item;

          return (
            <li
              onclick={() => {
                alert($item.get());
              }}
            >
              {$item}
            </li>
          );
        })}
      </div>
    </div>
  );
}

export default DynamicListExample;
