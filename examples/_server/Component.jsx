import { Page } from "@woofjs/server";
import { makeStyleSheet, styled } from "@woofjs/jss";

export function Component() {
  const $color = makeState("red");

  const classes = makeStyleSheet(this, {
    text: {
      color: $color,
      "&:hover": {
        color: "blue",
      },
    },
  });

  return (
    <Page>
      <p class={classes.text}>
        This is some red text if everything works correctly.
      </p>
    </Page>
  );
}
