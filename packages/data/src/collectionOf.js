import { Model } from "./Model";

export function collectionOf(model) {
  if (!(model instanceof Model)) {
    throw new TypeError(`Expected an instance of Model. Received: ${model}`);
  }

  return new Collection(model);
}

class Collection {
  constructor(model) {}
}
