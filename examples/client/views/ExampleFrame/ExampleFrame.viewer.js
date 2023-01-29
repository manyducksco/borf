import { makeViewer } from "woofe/viewer";
import { ExampleFrame } from "./ExampleFrame.jsx";

export default makeViewer(ExampleFrame, {
  presets: {
    "Example #1": {
      attrs: {
        value: 1,
      },
      decorator: (view) => {
        return <div>{view}</div>;
      },
      children: () => {
        return <h1>This is inside the frame!</h1>;
      },
    },
  },
});
