import ViewAttrsExample from "./ViewAttrsExample";

export default (view) => {
  view.description = "Illustrates how view attributes and actions are used.";

  view.render(ViewAttrsExample, {
    name: view.attribute("Jimbo", {
      description: "Name of a person.",
    }),

    color: view.attribute("#ff0088", {
      description: "Color of the person's name.",
      input: {
        type: "color",
      },
    }),

    quality: view.attribute("cool", {
      description: "A quality of the person.",
      input: {
        type: "select",
        options: ["cool", "rad", "wack"],
      },
    }),

    showQuality: view.attribute(true),

    onclick: view.action("button clicked", () => {
      console.log("callback is called when action is fired");
    }),
  });
};
