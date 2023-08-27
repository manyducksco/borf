import { readable, writable, spring, computed, repeat } from "@borf/browser";

const initialList = ["apple", "banana", "potato", "fried chicken"];

export default function DynamicList(props, ctx) {
  const $$shoppingList = writable(initialList);
  const $$inputValue = writable("");

  const getSorted = () => {
    return $$shoppingList
      .get()
      .map((x) => x)
      .sort();
  };

  const reset = () => {
    $$shoppingList.set(initialList);
    $$inputValue.set("");
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
          <input type="text" $$value={$$inputValue} />
          <button
            disabled={computed($$inputValue, (v) => v.trim() === "")}
            onclick={() => {
              // Add the current input value to the list and clear it.
              $$shoppingList.update((current) => {
                return [...current, $$inputValue.get()];
              });
              $$inputValue.set("");
            }}
          >
            Add Item
          </button>
          <button onclick={reset}>Reset List</button>
        </div>

        {repeat(
          $$shoppingList,
          (item) => item,
          ($item) => {
            return <Item value={$item} />;
          }
        )}

        {/* <Repeat
          items={$$shoppingList}
          key={(item) => item}
          render={($item, $index, ctx) => {
            return <Item value={$item} />;
          }}
        /> */}
      </div>
    </div>
  );
}

function Item(props, ctx) {
  const $$opacity = spring(0);
  const $$x = spring(-10);

  const $value = readable(props.value);

  ctx.onConnected(async () => {
    await Promise.all([$$opacity.animateTo(1), $$x.animateTo(0)]);
  });

  ctx.beforeDisconnect(async () => {
    await Promise.all([$$opacity.animateTo(0), $$x.animateTo(-10)]);
  });

  const onclick = () => {
    alert($value.get());
  };

  return (
    <li
      style={{
        opacity: $$opacity,
        transform: computed($$x, (x) => `translateX(${x}px)`),
      }}
      onclick={onclick}
    >
      {$value}
    </li>
  );
}
