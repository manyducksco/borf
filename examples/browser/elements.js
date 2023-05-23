import { element, html } from "@borf/elemental";

window.ELEMENTAL_LOG_LEVEL = "debug";

element("el-header", (c) => {
  c.debug("hello debug");
  c.info("hello info");
  c.log("hello log");
  c.warn("hello warn");
  c.error("hello error");

  c.set({ value: 0 });

  c.on("connect", (e) => {
    c.log("connected", e);
  });

  c.on("disconnect", (e) => {
    c.log("disconnected", e);
  });

  const increment = () => {
    c.set((current) => ({
      ...current,
      value: current.value + 1,
    }));
  };

  const decrement = () => {
    c.set((current) => ({
      ...current,
      value: current.value - 1,
    }));
  };

  c.render((state, attrs) => {
    return html`
      <header>
        <h1>${attrs.title ?? "Default Title"}</h1>
        <slot>Default child content.</slot>

        <test-nested label=${state.value}></test-nested>

        <button onclick=${increment}>+1</button>
        <button onclick=${decrement}>-1</button>

        ${state.value >= 10 &&
        html`<test-nested label="That's a lot of clicks!"></test-nested>`}
      </header>
    `;
  });
});

// optional second argument which is an array of observedAttributes
// in other words, attributes which will trigger a render when set
element("test-nested", ["label"], (c) => {
  c.render((state, attrs) => {
    return html`<p style="color:red">${attrs.label}</p>`;
  });

  c.on("connect", () => {
    c.log("connected");
  });

  c.on("disconnect", () => {
    c.log("disconnected");
  });
});
