import { html } from "./html.js";

test("works", async () => {
  const template = html`<p>This is some text</p>`;
  const result = await template.render();

  expect(result).toBe("<p>This is some text</p>");
});

test("function views", async () => {
  function Header(text) {
    return html`<h1>${text}</h1>`;
  }

  async function AsyncParagraph(text) {
    return html`<p>${text}</p>`;
  }

  const template = html`
    <div class="container">${Header("Hello!")}${AsyncParagraph("This component is async for testing purposes.")}</div>
  `;
  const result = await template.render();

  expect(result).toBe(
    `<div class="container"><h1>Hello!</h1><p>This component is async for testing purposes.</p></div>`
  );
});

test("arrays with map", async () => {
  const numbers = [1, 2, 3];
  const template = html`<ul>
    ${numbers.map((num) => html`<li>${num}</li>`)}
  </ul>`;

  const result = await template.render();

  expect(result).toBe(`<ul>\n  <li>1</li><li>2</li><li>3</li>\n</ul>`);
});
