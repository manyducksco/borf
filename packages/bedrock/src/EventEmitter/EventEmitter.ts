import { PubSub } from "../PubSub/PubSub.js";

export class EventEmitter<Events extends Record<string, any>> {
  #pubsub = new PubSub<{ event: keyof Events; data: any }>();

  on<E extends keyof Events>(event: E, callback: (data: Events[E]) => void) {
    return this.#pubsub.subscribe((emitted) => {
      if (emitted.event === event) {
        callback(emitted.data);
      }
    });
  }

  once<E extends keyof Events>(event: E, callback: (data: Events[E]) => void) {
    const unsubscribe = this.on(event, (data) => {
      unsubscribe();
      callback(data);
    });

    return unsubscribe;
  }

  emit<E extends keyof Events>(event: E, data: Events[E]) {
    this.#pubsub.publish({ event, data });
  }
}
