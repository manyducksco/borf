import { makeState, View } from "@borf/browser";

export class TwoWayBindExample extends View {
  setup(ctx) {
    const $$text = makeState("edit me");
    const $$size = makeState(18);

    return (
      <div class="example">
        <h3>
          Two way data binding with <code>.writable()</code>
        </h3>
        <div>
          <input value={$$text} />
          <input value={$$size} type="number" />{" "}
          {/* number value gets converted back to number */}
          <p
            style={{
              fontSize: $$size.map((s) => s + "px"),
            }}
          >
            {$$text}
          </p>
        </div>
      </div>
    );
  }
}
