import { h } from "./h";

const getService = () => ({});

async function getAsyncNumber(number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(number);
    }, 50);
  });
}

describe("h", () => {
  test("is truth", () => {
    expect(true).toBe(true);
  });

  test("renders strin", async () => {
    const template = h(
      "main",
      { class: "test" },
      h("input", { type: "range", min: 3, max: 5, step: 0.001, value: 3.81 })
    );

    const html = await template.init({ getService });

    expect(html).toBe(
      `<main class="test"><input type="range" min="3" max="5" step="0.001" value="3.81"></input></main>`
    );
  });

  test("renders componet good", async () => {
    function Component(attrs, self) {
      expect(typeof self.getService).toBe("function");
      expect(Array.isArray(self.children)).toBe(true);

      return h("h1", null, attrs.title);
    }

    async function AsyncComponent(attrs, self) {
      const number = await getAsyncNumber(12);

      return h("div", null, h("span", null, number), h("div", null, ...self.children));
    }

    const template = h(
      "main",
      { class: "test" },
      h(Component, { title: "HELLO" }),
      h(AsyncComponent, null, h("h3", null, "Test"))
    );

    const html = await template.init({ getService });

    expect(html).toBe(`<main class="test"><h1>HELLO</h1><div><span>12</span><div><h3>Test</h3></div></div></main>`);
  });
});
