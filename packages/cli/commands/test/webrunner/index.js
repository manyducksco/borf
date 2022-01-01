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
    createElement($) {
      return $("div", { class: styles.layout })($(Sidebar), $(Content));
    }
  }
);

app.setup(() => {
  document.querySelector(".static-loader").remove();
});

app.connect("#tests");
