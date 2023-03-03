import { View } from "@frameworke/fronte";
import { ExampleFrame } from "../views/ExampleFrame";

class CircleDrawer extends View {
  static label = "7guis:CircleDrawer";

  setup(ctx) {
    return (
      <ExampleFrame title="6. Circle Drawer">
        <div></div>
      </ExampleFrame>
    );
  }
}

export default CircleDrawer;
