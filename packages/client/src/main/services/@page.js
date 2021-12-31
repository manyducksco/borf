import { makeState } from "../state/makeState";
import { Service } from "../Service";

export default class Page extends Service {
  title = makeState(document?.title);

  _created() {
    if (document) {
      this.title.watch((value) => {
        document.title = value;
      });
    }
  }
}
