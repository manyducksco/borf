import { state } from "../state/state";
import { Service } from "../Service";

export default class Page extends Service {
  title = state(document?.title);

  _created() {
    if (document) {
      this.title((value) => {
        document.title = value;
      });
    }
  }
}
