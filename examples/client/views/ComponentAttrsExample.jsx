import { makeView } from "@woofjs/client";

export const ComponentAttrsExample = makeView((ctx, h) => {
  ctx.name = "ComponentAttrsExample";
  ctx.defaultState = {
    message: "test",
  };

  const $$message = ctx.writable("message");

  return h("div", { class: "example" }, [
    h("h3", "Component Attributes"),
    h("div", [
      h("input", { type: "text", value: $$message }),
      h("hr"),
      h(SubComponent, { message: $$message }),
    ]),
  ]);

  // return (
  //   <div class="example">
  //     <h3>Component Attributes</h3>
  //     <div>
  //       <input type="text" value={$$message} />
  //       <hr />
  //       <SubComponent message={$$message} />
  //     </div>
  //   </div>
  // );
});

const SubComponent = makeView((ctx, h) => {
  ctx.name = "SubComponent";

  return h("div", [
    h("p", "Message: ", ctx.readable("message")),
    h(
      "button",
      {
        onclick: () => {
          ctx.set("message", "test");
        },
      },
      "Reset State"
    ),
  ]);

  // return (
  //   <div>
  //     <p>Message: {ctx.readable("message")}</p>
  //     <button
  //       onclick={() => {
  //         // Sets the value which should set the parent component's message as well because it's two-way bound.
  //         ctx.set("message", "test");
  //       }}
  //     >
  //       Reset State
  //     </button>
  //   </div>
  // );
});
