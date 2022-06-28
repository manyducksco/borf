import { makeState, mergeStates } from "@woofjs/client";
import { proxyState } from "@woofjs/client";

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

      outer: for (const collection of collections) {
        for (const view of collection.views) {
          if (view.path === params.wildcard) {
            matched = view;
            self.getService("@page").$title.set(collection.name);
            break outer;
          }
        }
      }

      return matched;
    }
  );

  const $currentAttrs = proxyState({});

  self.afterConnect(() => {
    const frame = $frameRef.get();

    frame.addEventListener("load", () => {
      API = frame.contentWindow.WOOF_VIEW;

      API.onEvent("mount", (component) => {
        $currentAttrs.proxy(component.$attrs);
      });

      API.onEvent("unmount", () => {
        $currentAttrs.unproxy();
        $currentAttrs.set({});
      });

      $collections.set(API.getCollections());
      API.setActiveView($currentView.get("id"));
    });
  });

  self.watchState($currentView, (view) => {
    if (API) {
      API.setActiveView(view?.id);
    }
  });

  return {
    $frameRef,
    $collections,
    $currentView,
    $currentAttrs,
  };
};
