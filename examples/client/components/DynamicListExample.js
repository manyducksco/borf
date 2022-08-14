import { repeat, State } from "@woofjs/client";
import logLifecycle from "../utils/logLifecycle.js";

function DynamicListExample(self) {
  self.debug.name = "DynamicListExample";

  logLifecycle(self);

  const initialList = ["apple", "banana", "potato", "fried chicken"];

  const $shoppingList = new State(initialList);
  const $inputValue = new State("");

  const getSorted = () => {
    return $shoppingList
      .get()
      .map((x) => x)
      .sort();
  };

  const reset = () => {
    self.debug.log(initialList);
    $shoppingList.set(initialList);
  };

  return (
    <div class="example">
      <h3>
        Dynamic Lists with <code>repeat()</code>
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

        {repeat($shoppingList, ({ $attrs }) => {
          const $item = $attrs.map("value");

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
