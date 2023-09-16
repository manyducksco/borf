import { readable, writable, spring, computed, list } from "@borf/browser";

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
        Dynamic Lists with <code>list()</code>
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

        {list($$shoppingList, {
          itemKey: (item) => item,
          itemContent: ($item, $index) => (
            <Item
              value={$item}
              onRemove={() => {
                const index = $index.get();
                $$shoppingList.update((list) => {
                  return list.filter((item, i) => i !== index);
                });
              }}
            />
          ),
          // transitions: {
          //   enter: async ({ li }) => {
          //     const $$pos = spring(0, { endAmplitude: 0.01, endWindow: 5 });

          //     $$pos.observe((n) => {
          //       li.style.transform = `translateX(-${(1 - n) * 10}px)`;
          //       li.style.opacity = String(n);
          //     });

          //     await $$pos.animateTo(1);
          //   },
          //   exit: async ({ li }) => {
          //     const $$pos = spring(1, { endAmplitude: 0.01, endWindow: 5 });
          //     const $$size = spring(li.clientHeight);

          //     $$pos.observe((n) => {
          //       li.style.transform = `translateX(-${(1 - n) * 10}px)`;
          //       li.style.opacity = String(n);
          //     });
          //     $$size.observe((px) => {
          //       li.style.height = px + "px";
          //     });

          //     await $$pos.animateTo(0);
          //     await $$size.animateTo(0);
          //   },
          // },
        })}
      </div>
    </div>
  );
}

function Item(props, ctx) {
  const $value = readable(props.value);

  const onClick = () => {
    alert($value.get());
  };

  return (
    <div onClick={onClick}>
      {$value}{" "}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          props.onRemove();
        }}
      >
        &times;
      </button>
    </div>
  );
}
