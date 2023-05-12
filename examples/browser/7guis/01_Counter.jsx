import { Writable, html } from "@borf/browser";
import { ExampleFrame } from "../views/ExampleFrame";

export default function (_, ctx) {
  ctx.name = "7GUIs:Counter";

  const $$count = new Writable(0);

  // html helper can be used in lieu of JSX:
  return html`
    <${ExampleFrame} title="1. Counter">
      <div>
        <input type="text" value=${$$count.toReadable()} readonly />
        <button
          onclick=${() => {
            $$count.value += 1;
          }}
        >
          Increment
        </button>
      </div>
    </${ExampleFrame}>
  `;

  // return (
  //   <ExampleFrame title="1. Counter">
  //     <div>
  //       <input type="text" value={$$count.toReadable()} readonly />
  //       <button
  //         onclick={() => {
  //           $$count.value += 1;
  //         }}
  //       >
  //         Increment
  //       </button>
  //     </div>
  //   </ExampleFrame>
  // );
}
