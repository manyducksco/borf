import { repeat } from "@woofjs/client";
import logLifecycle from "../utils/logLifecycle.js";

const initialList = ["apple", "banana", "potato", "fried chicken"];

export function DynamicListExample() {
  this.name = "DynamicListExample";
  this.defaultState = {
    shoppingList: initialList,
    inputValue: "",
  };

  logLifecycle(this);

  const getSorted = () => {
    return this.get("shoppingList")
      .map((x) => x)
      .sort();
  };

  const reset = () => {
    this.set("shoppingList", initialList);
  };

  return (
    <div class="example">
      <h3>
        Dynamic Lists with <code>repeat()</code>
      </h3>

      <div>
        <button
          onclick={() => {
            this.set("shoppingList", getSorted());
          }}
        >
          Sort A to Z
        </button>

        <button
          onclick={() => {
            this.set("shoppingList", getSorted().reverse());
          }}
        >
          Sort Z to A
        </button>

        <div class="flex-center">
          <input type="text" value={this.readWrite("inputValue")} />
          <button
            disabled={this.read("inputValue").to((v) => v.trim() == "")}
            onclick={() => {
              // Add the current input value to the list and clear it.
              const inputValue = this.get("inputValue");
              this.set("shoppingList", (current) => {
                current.push(inputValue);
              });
              this.set("inputValue", "");
            }}
          >
            Add Item
          </button>
          <button onclick={reset}>Reset List</button>
        </div>

        {repeat(this.read("shoppingList"), function ListItem() {
          const $item = this.read("value");

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
