import ViewAttrsExample from "./ViewAttrsExample";

export default (view) => {
  view.description = "Illustrates how view attributes and actions are used.";

  view.render(ViewAttrsExample, {
    name: view.attribute("Jimbo", {
      description: "Name of a person.",
    }),

    quality: view.attribute("cool", {
      description: "A quality of the person.",
      input: {
        type: "select",
        options: ["cool", "rad", "wack"],
      },
    }),

    onclick: view.action("button clicked", () => {
      console.log("callback is called when action is fired");
    }),
  });
};
