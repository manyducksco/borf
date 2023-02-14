import { makeState, View } from "woofe";
import { ExampleFrame } from "./ExampleFrame";

export class RenderOrderTest extends View {
  setup(ctx, m) {
    const $$isTrue = makeState(true);

    let interval;

    ctx.afterConnect(() => {
      interval = setInterval(() => {
        $$isTrue.update((t) => !t);
      }, 1000);
    });

    ctx.beforeDisconnect(() => {
      clearInterval(interval);
    });

    return (
      <ExampleFrame title="Render Order Test">
        <p>You should be seeing these in the order: 1 a 2 b 3 c 4 5 d</p>

        <ul>
          {m.when($$isTrue, <SubView value={1} />)}
          <SubView value="a" />
          {m.when($$isTrue, <SubView value={2} />)}
          <SubView value="b" />
          {m.when($$isTrue, <SubView value={3} />)}
          <SubView value="c" />
          {m.when($$isTrue, <SubView value={4} />)}
          {m.when($$isTrue, <SubView value={5} />)}
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
