import { Writable, View } from "@borf/browser";
import { ExampleFrame } from "./ExampleFrame";

export class RenderOrderTest extends View {
  setup(ctx) {
    const $$isTrue = new Writable(true);

    let interval;

    ctx.onConnect(() => {
      interval = setInterval(() => {
        $$isTrue.update((t) => !t);
      }, 1000);
    });

    ctx.onDisconnect(() => {
      clearInterval(interval);
    });

    return (
      <ExampleFrame title="Render Order Test">
        <p>You should be seeing these in the order: 1 a 2 b 3 c 4 5 d</p>

        <ul>
          {View.when($$isTrue, <SubView value={1} />)}
          <SubView value="a" />
          {View.when($$isTrue, <SubView value={2} />)}
          <SubView value="b" />
          {View.when($$isTrue, <SubView value={3} />)}
          <SubView value="c" />
          {View.when($$isTrue, <SubView value={4} />)}
          {View.when($$isTrue, <SubView value={5} />)}
          <SubView value="d" />
        </ul>
      </ExampleFrame>
    );
  }
}

class SubView extends View {
  // static inputs = {
  //   value: {
  //     type: ["string", "number"], // TODO: Support array of types as a kind of union type
  //   },
  // };

  setup(ctx) {
    const { value } = ctx.inputs.get();

    return <li>{value}</li>;
  }
}
