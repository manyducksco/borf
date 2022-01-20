import { makeService, makeState } from "@woofjs/app";

export default makeService((self) => {
  const $frameRef = makeState();
  const $currentView = makeState();

  let frame;
  let view;
  let frameControls;

  self.watchState($frameRef, (current) => {
    frameControls = null;

    if (current) {
      frame = current;
      frame.onload = () => {
        // The views bundle running in the iframe calls this after it loads.
        frame.contentWindow.WoofLoaded = () => {
          frameControls = frame.contentWindow.WoofTest;

          frameControls.$currentView.watch((view) => {
            $currentView.set(view);
          });

          $currentView.set(frameControls.$currentView.get());

          if (view) {
            setView(view);
          }
        };
      };
    }
  });

  function setView(newView) {
    view = newView;

    if (frame) {
      frame.style.display = "flex";
    }

    if (frameControls) {
      frameControls.setView(newView);
    }
  }

  function clearView() {
    if (frameControls) {
      frameControls.clearView();
    }

    if (frame) {
      frame.style.display = "none";
    }
  }

  return {
    $frameRef,
    $currentView,

    setView,
    clearView,
  };
});
