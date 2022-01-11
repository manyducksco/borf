import { makeComponent, makeState, mergeStates } from "@woofjs/app";

export default makeComponent(($, self) => {
  const testbed = self.getService("testbed");

  const $view = self.$route.map("query.view");
  const $suite = self.$route.map("wildcard", (path) => testbed.getSuite(path));

  const $currentView = mergeStates($suite, $view, (suite, view) => {
    if (suite && view) {
      return {
        path: suite.path,
        name: view,
      };
    } else {
      return null;
    }
  });

  return $("div", { class: "content" })(
    $(ViewFrame, { currentView: $currentView }),
    $.if($currentView, null, () => $(SuiteTests, { suite: $suite }))
  );
});

const ViewFrame = makeComponent(($, self) => {
  const views = self.getService("views");

  self.connected(() => {
    self.watchState(
      self.$attrs,
      "currentView",
      (value) => {
        if (value) {
          views.setView(value);
        } else {
          views.clearView();
        }
      },
      { immediate: true }
    );
  });

  const $viewAttrs = views.$currentView.map((current) => {
    if (current) {
      return current.$attrs.get();
    } else {
      return [];
    }
  });

  return $("div", {
    class: "viewContent",
    style: {
      display: self.$attrs.map("currentView", (view) =>
        view ? "flex" : "none"
      ),
    },
  })(
    $("iframe", {
      class: "viewFrame",
      ref: views.$frameRef,
      src: "/views/index.html",
    }),
    $.if(
      $viewAttrs.map((items) => items.length > 0),
      () => {
        return $("div", { class: "viewAttrs" })(
          $.each(
            attrs,
            (attr) => attr.name,
            (attr) => $(ViewAttr)({ attr })
          )
        );
      }
    )
  );
});

const ViewAttr = makeComponent(($, self) => {
  const attr = self.$attrs.get("$attr").get();

  return $("div", { class: "attr" })(
    $("h4", { class: "attrLabel" })(attr.name),
    $("input")({
      class: "attrInput",
      type: "text",
      value: $.bind(attr.state),
    })
  );
});

const SuiteTests = makeComponent(($, self) => {
  // This is kind of weird. $attrs is a state that can contain states.
  const $results = makeState([]);
  const $progress = makeState({ total: 0, done: 0 });
  const $hasResults = $results.map((current) => current.length > 0);
  const $isRunning = $progress.map((current) => current.done < current.total);

  async function runTestSuite(suite) {
    $results.set([]);
    $progress.set((current) => {
      current.total = suite.tests.length;
      current.done = 0;
    });

    await suite.run({
      onTestFinish: (result) => {
        $results.set((current) => {
          current.push(result);
        });
        $progress.set((current) => {
          current.done += 1;
        });
      },
    });
  }

  self.connected(() => {
    self.watchState(
      self.$attrs,
      "suite",
      (current) => {
        if (current) {
          runTestSuite(current);
        }
      },
      { immediate: true }
    );
  });

  return $("div", { class: "testResults" })(
    $.text($progress.map((p) => `Tests run: ${p.done} of ${p.total}`)),
    $.if(
      $hasResults,
      () =>
        $("div")(
          $.each(
            $results,
            (result) => result.name,
            (result) => {
              return $("div")(
                $("h2")(result.name),
                $("ul", { style: { listStyle: "none" } })(
                  $.each(
                    result.meta,
                    (m) => m.label,
                    (m) =>
                      $("li")(
                        "ℹ️ ",
                        $("code", { class: "testMetaTag" })("[INFO]"),
                        " ",
                        $("span", { class: "testMetaText" })(m.label)
                      )
                  ),
                  $.each(
                    result.assertions,
                    (a) => a.label,
                    (a) =>
                      $("li")(
                        $.if(
                          a.pass,
                          () => $("span")("✅ ", $("code")("[PASS]"), " "),
                          () => $("span")("🔥 ", $("code")("[FAIL]"), " ")
                        ),
                        a.label,
                        $.if(a.time, () =>
                          $("span")(" (+", $.text(a.time), "ms)")
                        )
                      )
                  )
                )
              );
            }
          )
        ),
      // If no results
      () => $("span")($.if($isRunning, "Running tests...", "No selection"))
    )
  );
});
