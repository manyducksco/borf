import test from "ava";
import { RenderConfig, html, render } from "./html.js";
import { DebugHub } from "./classes/DebugHub.js";
import { CrashCollector } from "./classes/CrashCollector.js";
import { NoCache } from "./classes/StaticCache.js";

function mockRenderConfig(): RenderConfig {
  const debugHub = new DebugHub();
  const crashCollector = new CrashCollector({
    onCrash: (entry) => {},
    onReport: (entry) => {},
    sendStackTrace: "development",
  });

  return {
    appContext: {
      debugHub,
      crashCollector,
      staticCache: new NoCache(),
      stores: new Map(),
      mode: "development",
    },
  };
}

test("works", async (t) => {
  const template = html`<p>This is some text</p>`;
  const result = await render(template, mockRenderConfig());

  t.is(result, "<p>This is some text</p>");
});

test("function views", async (t) => {
  function Header(text: string) {
    return html`<h1>${text}</h1>`;
  }

  async function AsyncParagraph(text: string) {
    return html`<p>${text}</p>`;
  }

  const template = html`
    <div class="container">${Header("Hello!")}${AsyncParagraph("This component is async for testing purposes.")}</div>
  `;
  const result = await render(template, mockRenderConfig());

  t.is(result, `<div class="container"><h1>Hello!</h1><p>This component is async for testing purposes.</p></div>`);
});

test("arrays with map", async (t) => {
  const numbers = [1, 2, 3];
  const template = html`<ul>
    ${numbers.map((num) => html`<li>${num}</li>`)}
  </ul>`;

  const result = await render(template, mockRenderConfig());

  t.is(result, `<ul>\n  <li>1</li><li>2</li><li>3</li>\n</ul>`);
});
