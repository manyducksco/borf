import {
  html,
  when,
  useConnected,
  useDisconnected,
  useAttributes,
  Writable,
} from "@borf/browser";
import { ExampleFrame } from "./ExampleFrame";

export function RenderOrderTest() {
  const $$isTrue = new Writable(true);

  let interval;

  useConnected(() => {
    interval = setInterval(() => {
      $$isTrue.update((t) => !t);
    }, 1000);
  });

  useDisconnected(() => {
    clearInterval(interval);
  });

  return html`
    <${ExampleFrame} title="Render Order Test">
      <p>You should be seeing these in the order: 1 a 2 b 3 c 4 5 d</p>

      <ul>
        ${when($$isTrue, html`<${SubView} value=${1} />`)}
        <${SubView} value="a" />
        ${when($$isTrue, html`<${SubView} value=${2} />`)}
        <${SubView} value="b" />
        ${when($$isTrue, html`<${SubView} value=${3} />`)}
        <${SubView} value="c" />
        ${when($$isTrue, html`<${SubView} value=${4} />`)}
        ${when($$isTrue, html`<${SubView} value=${5} />`)}
        <${SubView} value="d" />
      </ul>
    <//>
  `;

  // return m(ExampleFrame, { title: "Render Order Test" }, [
  //   m.p("You should be seeing these in the order: 1 a 2 b 3 c 4 5 d"),

  //   m.ul([
  //     m.$if($$isTrue, m(SubView, { value: 1 })),
  //     m(SubView, { value: "a" }),
  //     m.$if($$isTrue, m(SubView, { value: 2 })),
  //     m(SubView, { value: "b" }),
  //     m.$if($$isTrue, m(SubView, { value: 3 })),
  //     m(SubView, { value: "c" }),
  //     m.$if($$isTrue, m(SubView, { value: 4 })),
  //     m.$if($$isTrue, m(SubView, { value: 5 })),
  //     m(SubView, { value: "d" }),
  //   ]),
  // ]);
}

function SubView() {
  const attrs = useAttributes();
  const { value } = attrs.get();

  return html`<li>${value}</li>`;
}
