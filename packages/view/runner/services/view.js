import { makeState, mergeStates } from "@woofjs/client";

export default (self) => {
  let API;

  const { $params } = self.getService("@router");

  const $frameRef = makeState();
  const $collections = makeState([]);

  const $currentView = mergeStates(
    $collections,
    $params,
    (collections, params) => {
      let matched;

      const wildcard = params.wildcard.startsWith("/")
        ? params.wildcard.slice(1)
        : params.wildcard;

      outer: for (const collection of collections) {
        for (const view of collection.views) {
          if (view.path === wildcard) {
            matched = view;
            break outer;
          }
        }
      }

      return matched;
    }
  );

  self.watchState($currentView, (view) => {
    if (API) {
      console.log(view, API);
      API.setActiveView(view?.id);
    }
  });

  self.afterConnect(() => {
    const frame = $frameRef.get();

    frame.addEventListener("load", () => {
      API = frame.contentWindow.WOOF_VIEW;
      $collections.set(API.getCollections());
    });
  });

  return {
    $frameRef,
    $collections,
    $currentView,
  };
};
