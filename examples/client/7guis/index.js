import { View } from "@borf/browser";

class SevenGUIs extends View {
  setup(ctx) {
    return (
      <div>
        <p style={{ padding: "1rem 1rem 0 1rem" }}>
          This is an implementation of{" "}
          <a href="https://eugenkiss.github.io/7guis/">7GUIs</a>, a system for
          evaluating UI frameworks.
        </p>

        <div>{ctx.outlet()}</div>
      </div>
    );
  }
}

export default SevenGUIs;
