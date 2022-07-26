import { makeState } from "@woofjs/client";
import { makeStyleSheet } from "@woofjs/jss";

import { Observable } from "rxjs";

export default function JSSExample() {
  this.debug.name = "JSSExample";

  const $activeColor = makeState("red");

  const activeColor = new Observable((observer) => {
    observer.next("red");
  });

  console.log({ $activeColor, activeColor });

  const classes = makeStyleSheet(this, {
    paragraph: {
      borderBottom: "1px solid blue",
    },
    button: {
      border: "1px solid black",
      borderRadius: 6,
      fontWeight: "bold",
      padding: ["0.25rem", "0.5rem"],
      backgroundColor: $activeColor,
      // "&:hover": {
      //   backgroundColor: "blue",
      // },
    },
  });

  return (
    <div class="example">
      <h3>JSS Example</h3>

      <p class={classes.paragraph}>Paragraph</p>

      <button class={classes.button}>This is a button</button>
    </div>
  );
}
