import { View } from "@borf/browser";
import { ExampleFrame } from "../views/ExampleFrame";

class Cells extends View {
  static label = "7guis:Cells";

  setup(ctx) {
    return (
      <ExampleFrame title="7. Cells">
        <div></div>
      </ExampleFrame>
    );
  }
}

export default Cells;
