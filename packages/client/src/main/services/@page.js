import { createState } from "../state/createState";
import { Service } from "../Service";

export default class Page extends Service {
  title = createState(document?.title);

  _created() {
    if (document) {
      this.title.watch((value) => {
        document.title = value;
      });
    }
  }
}
