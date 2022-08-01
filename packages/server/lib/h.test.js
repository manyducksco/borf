import { h } from "./h";
import { makeDebug } from "./helpers/makeDebug";

const appContext = { services: {}, debug: makeDebug() };

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

    const html = await template.init(appContext);

    expect(html).toBe(
      `<main class="test"><input type="range" min="3" max="5" step="0.001" value="3.81"></input></main>`
    );
  });

  test("renders componet good", async () => {
    function Component(self) {
      expect(typeof self.services).toBe("object");
      expect(Array.isArray(self.children)).toBe(true);

      return h("h1", null, this.attrs.title);
    }

    async function AsyncComponent(self) {
      const number = await getAsyncNumber(12);

      return h("div", null, h("span", null, number), h("div", null, ...self.children));
    }

    const template = h(
      "main",
      { class: "test" },
      h(Component, { title: "HELLO" }),
      h(AsyncComponent, null, h("h3", null, "Test"))
    );

    const html = await template.init(appContext);

    expect(html).toBe(`<main class="test"><h1>HELLO</h1><div><span>12</span><div><h3>Test</h3></div></div></main>`);
  });

  test("renders class arrays", async () => {
    const template = h("div", { class: ["one", "two"] });

    const html = await template.init(appContext);

    expect(html).toBe(`<div class="one two"></div>`);
  });

  test("renders class objects", async () => {
    const template = h("div", {
      class: {
        one: true,
        two: true,
        three: false,
        four: null,
      },
    });

    const html = await template.init(appContext);

    expect(html).toBe(`<div class="one two"></div>`);
  });

  test("renders class arrays containing class objects", async () => {
    const template = h("div", {
      class: [
        "zero",
        {
          one: true,
          two: true,
          three: false,
          four: null,
        },
        {
          five: true,
        },
      ],
    });

    const html = await template.init(appContext);

    expect(html).toBe(`<div class="zero one two five"></div>`);
  });
});
