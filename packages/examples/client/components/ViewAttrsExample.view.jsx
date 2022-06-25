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

    percentage: view.attribute(100, {
      description: "A number on a sliding scale.",
      input: {
        type: "range",
        min: 1,
        max: 100,
        step: 2,
      },
    }),

    multiplier: view.attribute(1, {
      description: "A number to multiply the percentage by.",
    }),

    quality: view.attribute("cool", {
      description: "A quality of the person.",
      input: {
        type: "select",
        options: ["cool", "rad", "wack"],
      },
    }),

    punctuation: view.attribute(".", {
      input: {
        type: "radio",
        options: [".", "!", "!?!?"],
      },
    }),

    showQuality: view.attribute(true),

    onclick: view.action("button clicked", () => {
      console.log("callback is called when action is fired");
    }),

    callback: view.attribute(function () {}),
  });
};
