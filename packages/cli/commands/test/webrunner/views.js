import { makeState } from "@manyducksco/woof";
import { suite } from "@manyducksco/woof/test";
import setup from "$bundle";

(function () {
  const currentView = makeState();
  const suites = makeState([], {
    methods: {
      add: (current, path, views) => [...current, { path, views }],
    },
  });

  function loadViews() {
    const views = [];

    const test = () => {};
    const view = (name, fn) => {
      views.push({ name, fn });
    };

    suite({ test, view });

    return views;
  }

  setup((path, suite) => {
    this.suites.add(path, loadViews(suite));
  });

  suites.watch((items) => {
    console.log(items);
  });

  currentView.watch((view) => {
    console.log("current", view);
  });

  window.woofTestSetView = (suite, view) => {
    const matchingSuite = suites.get().find((s) => s.path === suite);

    if (matchingSuite) {
      const matchingView = matchingSuite.views.find((v) => v.name === view);

      if (matchingView) {
        console.log("found matching view", matchingView);
      } else {
        console.log("found no matching view", { suite, view });
      }
    } else {
      console.log("found no matching suite", { suite, view });
    }
  };
})();
