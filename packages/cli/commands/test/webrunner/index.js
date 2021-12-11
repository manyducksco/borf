import { App, Component, Styles } from "@manyducksco/woof";
import TestBed from "./services/TestBed.js";
import Content from "./components/Content.js";
import Sidebar from "./components/Sidebar.js";

const app = new App();

const styles = new Styles({
  layout: {
    display: "flex",
    alignItems: "stretch",
    position: "fixed",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
});

app.service("testbed", TestBed);

app.route(
  "*",
  class extends Component {
    // TODO: Implement preload callback for route components
    preload($, done) {
      // Special hook for route components.
      // If it returns an $(element), that element will be displayed until done() is called.
      // If it doesn't return anything, the previous route will stay loaded until done() is called.
      // Can be used to preload data before finally mounting the component.

      setTimeout(() => {
        done();
      }, 300);

      return $("span")("Loading...");
    }

    createElement($) {
      return $("div", { class: styles.layout })($(Sidebar), $(Content));
    }
  }
);

app.setup((getService) => {
  document.querySelector(".static-loader").remove();
});

app.connect("#tests");
