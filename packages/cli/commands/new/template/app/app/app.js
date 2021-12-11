import { App } from "@manyducksco/woof";

const app = new App({
  hash: true,
});

app.route(
  "*",
  class extends Component {
    createElement($) {
      return $("h1")("Hello World");
    }
  }
);

app.connect("#root");
