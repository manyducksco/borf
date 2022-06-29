import { MyHeader } from "./MyHeader.jsx";
import { makeMockHTTP } from "@woofjs/client/testing";

/**
 * Views are defined by an exported function. This function receives a `view` object with variables
 * and methods to configure the view. You can also export an object with view names as keys and
 * functions as values if you want to create multiple views for a single component.
 **/
export default (view) => {
  // Views are named by converting the function name from "PascalCaseLikeThis" to "Sentence Case Like This".
  // If you don't like this conversion, you can override it to any string you want:
  view.name = "Custom name here";

  // The description will be shown alongside the view. Use this space to explain what the purpose of the view is
  // and what unfamiliar users need to know. Supports Markdown formatting.
  view.description = `
    # Personalized Header

    This header displays a custom greeting and the user's name.
    You can select a few example greetings from a list in this view.
  `;

  // Provide mock versions of any services used by your component.
  view.service(
    "@http",
    /**
     * We are using makeMockHTTP from the testing tools to create an `@http` service
     * that returns mock data. This prevents the view from touching a real API.
     **/
    makeMockHTTP((self) => {
      self.get("/users/me", () => {
        // Log this event to the action log whenever the component makes a call to this mock API route.
        // This validates that the expected API calls are actually being made within the view.
        view.fireAction("requested user from API");

        return { id: 1, name: "Jimbo Jones" };
      });
    })
  );

  view.render(MyHeader, {
    // You can expose attributes to make them editable in the browser with a dedicated UI.
    greeting: view.attribute("Bonjour", {
      // The attribute key is used as the name by default (`greeting` in this case), but you can provide your own:
      name: "The Greeting",

      // Provide a description that will be displayed next to the input.
      description: "A phrase to greet the user with.",

      // The type of input the user sees is chosen based on the data type by default.
      // A string attribute would normally show a text input. Here we use a dropdown menu with preset options.
      input: {
        type: "select",
        options: ["Bonjour", "Howdy", "Konnichiwa"],
      },
    }),

    // Actions are no-op functions that log when they are called.
    // Useful as dummy functions to test that callbacks are working as you interact with components.
    onclick: view.action("header clicked"),
  });
};
