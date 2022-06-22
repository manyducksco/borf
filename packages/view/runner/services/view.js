import { makeState } from "@woofjs/client";

export default (self) => {
  const $frameRef = makeState();
  let API;

  self.afterConnect(() => {
    const frame = $frameRef.get();

    frame.addEventListener("load", () => {
      API = frame.contentWindow.WOOF_VIEW;

      self.debug.log(API, API.getCollections());
    });
  });

  function getCollections() {
    return API.getCollections();
  }

  function setActiveView(id) {
    API.setActiveView(id);
  }

  return {
    $frameRef,

    getCollections,
    setActiveView,
  };
};
