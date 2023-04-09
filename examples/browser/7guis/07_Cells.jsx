import { View } from "@borf/browser";
import { ExampleFrame } from "../views/ExampleFrame";

export default new View({
  label: "7guis:Cells",

  setup(ctx) {
    return (
      <ExampleFrame title="7. Cells">
        <div></div>
      </ExampleFrame>
    );
  },
});
