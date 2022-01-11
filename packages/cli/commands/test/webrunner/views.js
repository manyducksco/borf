import { makeState } from "@woofjs/app";
import setup from "$bundle";

(function () {
  const $currentView = makeState();
  const $suites = makeState([]);
  let mounted;

  setup((path, suite) => {
    $suites.set((current) => {
      current.push({ path, ...suite });
    });
  });

  $currentView.watch((view) => {
    if (mounted) {
      mounted.disconnect();
    }

    if (view) {
      mounted = view.element;
      mounted.connect(document.getElementById("app"));
    }
  });

  window.WoofTest = {
    $currentView,
    setView: (viewInfo) => {
      const suite = $suites.get().find((s) => s.path === viewInfo.path);

      if (suite) {
        const view = suite.makeView(viewInfo.name);

        if (view) {
          $currentView.set(view);
        } else {
          console.log("found no matching view", { suite, viewInfo });
        }
      } else {
        console.log("found no matching suite", viewInfo);
      }
    },
    clearView() {
      $currentView.set(null);
    },
    runSuite: (suite) => {},
  };

  if (window.WoofLoaded) {
    window.WoofLoaded();
  }
})();
