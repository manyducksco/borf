import { readable, writable, StoreScope, computed, cond } from "@borf/browser";
import { ExampleFrame } from "../views/ExampleFrame";

function CounterStore(ctx) {
  ctx.onConnected(() => {
    ctx.log("store connected:", ctx.options.location);
  });

  ctx.onDisconnected(() => {
    ctx.log("store disconnected:", ctx.options.location);
  });

  const $$value = writable(0);

  return {
    location: ctx.options.location,
    $value: readable($$value),
    increment: () => {
      $$value.update((n) => n + 1);
    },
    decrement: () => {
      $$value.update((n) => Math.max(0, n - 1));
    },
  };
}

function CounterView(props, ctx) {
  const { $value, increment, decrement, location } = ctx.getStore(CounterStore);

  return (
    <div>
      <h2>
        The store value is: {$value} ({location})
      </h2>
      <div>
        <button onclick={decrement} disabled={computed($value, (n) => n === 0)}>
          -1
        </button>
        <button onclick={increment}>+1</button>
      </div>
    </div>
  );
}

export default function ScopedStores(props, ctx) {
  const $$toggled = writable(false);

  let interval;

  ctx.onConnected(() => {
    interval = setInterval(() => {
      $$toggled.update((x) => !x);
    }, 1000);
  });

  ctx.onDisconnected(() => {
    clearInterval(interval);
  });

  return (
    <ExampleFrame title="Scoped Stores">
      <ul>
        <li>
          <StoreScope store={CounterStore} options={{ location: "Top Level" }}>
            <CounterView />

            <ul>
              <li>
                <StoreScope
                  store={CounterStore}
                  options={{ location: "Shadowed" }}
                >
                  <CounterView />
                </StoreScope>
              </li>

              {cond($$toggled, <CounterView />)}
            </ul>
          </StoreScope>
        </li>
      </ul>
    </ExampleFrame>
  );
}
