import { $Watch } from "./$Watch";

export class $If extends $Watch {
  constructor(source, then, otherwise = null) {
    super(source, (current) => {
      if (current) {
        return then;
      } else {
        return otherwise;
      }
    });
  }
}
