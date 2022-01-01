import { Component, Styles, makeState } from "@manyducksco/woof";
import { wrap } from "@manyducksco/woof/test";

const styles = new Styles({
  content: {
    // border: "1px solid blue",
    flex: "1 1 100%",
    overflowY: "auto",
  },
  view: {
    position: "relative",
    display: "flex",
    flexFlow: "row nowrap",
    height: "100%",
  },
  viewContent: {
    flex: "1 1 100%",
    padding: "0.5em",
    overflowY: "auto",
  },
  testResults: {
    padding: "0.5em",
    overflowY: "auto",
  },
  testMetaTag: {
    color: "#555",
  },
  testMetaText: {
    color: "#777",
    fontStyle: "italic",
  },
  viewAttrs: {
    borderLeft: "1px solid #999",
    width: "300px",
    display: "flex",
    flexFlow: "column nowrap",
    alignItems: "stretch",
    overflowY: "auto",
  },
  attr: {
    padding: "0.5em",
    borderBottom: "1px dotted #999",
  },
  attrLabel: {
    marginBottom: "0.25em",
    lineHeight: "1",
  },
  attrInput: {
    width: "100%",
    fontSize: "inherit",
    fontFamily: "inherit",
    padding: "0 0.25em",
    height: "26px",
  },
});

export default class Content extends Component {
  createElement($) {
    const { params, query } = this.service("@router");
    const testbed = this.service("testbed");

    const suite = params.map((p) => testbed.getSuite(p.wildcard));
    const view = query.map((q) => q.view || null);

    return $("div")(
      { class: styles.content },
      $.if(
        view,
        () => $(SuiteView, { suite, view }),
        () => $(SuiteTests, { suite })
      )
    );
  }
}

class SuiteTests extends Component {
  results = makeState(null, {
    methods: {
      push: (current, ...items) => {
        if (current == null) {
          current = [];
        }

        return [...current, ...items];
      },
    },
  });
  progress = makeState(
    { total: 0, done: 0 },
    {
      methods: {
        start: (current, total) => {
          return {
            total,
            done: 0,
          };
        },
        inc: (current) => {
          return {
            total: current.total,
            done: current.done + 1,
          };
        },
      },
    }
  );
  hasResults = this.results.map((value) => value != null);
  isRunning = this.progress.map((value) => value.done < value.total);

  _connected() {
    if (this.attributes.suite) {
      console.log(this.attributes.suite.get());
      this.runTestSuite(this.attributes.suite.get());
    }
  }

  createElement($) {
    this.watchState(this.attributes.suite, (value) => {
      this.runTestSuite(value);
    });

    return $("div")(
      { class: styles.testResults },
      $.text(this.progress.map((p) => `Tests run: ${p.done} of ${p.total}`)),
      $.if(
        this.hasResults,
        () =>
          $("div")(
            $.each(
              this.results,
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
                          $("code", { class: styles.testMetaTag })("[INFO]"),
                          " ",
                          $("span", { class: styles.testMetaText })(m.label)
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
        () =>
          $("span")($.if(this.isRunning, "Running tests...", "No selection"))
      )
    );
  }

  async runTestSuite(suite) {
    this.results.set([]);
    this.progress.start(suite.tests.length);

    for (const test of suite.tests) {
      const [meta, assertions] = await this.runTest(test.fn, suite.views);

      this.results.push({
        name: test.name,
        pass: !assertions.some((a) => a.pass === false),
        meta,
        assertions,
      });

      this.progress.inc();
    }
  }

  async runTest(fn, views) {
    return new Promise(async (resolve) => {
      let expected;
      let waitTime = 2000; // 2 second default
      let assertions = [];
      let meta = [];
      let timeout;
      let lastAssertion;
      let createdViews = [];

      const done = () => {
        while (createdViews.length > 0) {
          createdViews.pop().$disconnect();
        }

        resolve([meta, assertions]);
      };

      const tools = {
        expect(count) {
          expected = count;
          meta.push({
            label: `expecting ${count} ${pluralize("assertion", expected)}`,
          });
        },
        timeout(ms) {
          waitTime = ms;
        },
        assert(condition, label) {
          const now = Date.now();

          assertions.push({
            pass: !!condition,
            label: label || `unlabeled assertion ${assertions.length + 1}`,
            time: lastAssertion ? now - lastAssertion : 0,
          });

          lastAssertion = now;

          if (timeout && assertions.length === expected) {
            clearTimeout(timeout);
            done();
          }
        },
        makeView(name) {
          const view = views.find((v) => v.name === name);

          if (view == null) {
            throw new Error(
              `View not found in this test suite. Received: ${name}`
            );
          }

          const createComponent = wrap(
            class extends Component {
              createElement($) {
                return view.fn($, {
                  attr: (name, value) =>
                    value.isState || value instanceof Function
                      ? value
                      : makeState(value, { immutable: true }),
                });
              }
            }
          ).create();

          const frag = new DocumentFragment();
          const node = createComponent();

          node.$connect(frag);
          createdViews.push(node);

          return {
            querySelector(selectors) {
              return frag.querySelector(selectors);
            },
            querySelectorAll(selectors) {
              return frag.querySelectorAll(selectors);
            },
          };
        },
      };

      const promise = fn(tools);

      if (promise instanceof Promise) {
        await promise;
      }

      if (expected) {
        if (assertions.length < expected) {
          meta.push({
            label: `waiting up to ${waitTime} ms for async assertions`,
          });
          timeout = setTimeout(() => {
            if (assertions.length < expected) {
              assertions.push({
                pass: false,
                label: `test makes ${expected} ${pluralize(
                  "assertion",
                  expected
                )} within ${waitTime} ms (received ${assertions.length})`,
              });
            }
            done();
          }, waitTime);
        } else if (assertions.length > expected) {
          assertions.push({
            pass: false,
            label: `test makes ${expected} ${pluralize(
              "assertion",
              expected
            )} (received ${assertions.length})`,
          });
          done();
        } else {
          done();
        }
      } else {
        done();
      }
    });
  }
}

class SuiteView extends Component {
  createElement($) {
    const { suite, view } = this.attributes;
    const selectedView = suite.map((s) =>
      s.views.find((v) => v.name === view.get())
    );
    const attrs = makeState([], {
      settable: true,
      methods: {
        push: (current, value) => [...current, value],
        clear: () => [],
      },
    });
    const hasAttrs = attrs.map((x) => x.length > 0);

    const makeAttr = (name, value, options = {}) => {
      const s = makeState(value);

      attrs.push({
        name,
        state: s,
        options: {
          ...options,
        },
      });

      return s;
    };

    return $.if(
      selectedView,
      () => {
        return $("div", { class: styles.view })(
          $("div", { class: styles.viewContent })(
            $.watch(selectedView, (view) => {
              attrs.clear();

              return view.fn($, { attr: makeAttr });
            })
          ),
          $.if(hasAttrs, () => {
            return $("div", { class: styles.viewAttrs })(
              $.each(
                attrs,
                (attr) => attr.name,
                (attr) => $(ViewAttr)({ attr })
              )
            );
          })
        );
      },
      () => $("span")("view not found")
    );
  }
}

class ViewAttr extends Component {
  createElement($) {
    const attr = this.attributes.attr.get();

    return $("div", { class: styles.attr })(
      $("h4", { class: styles.attrLabel })(attr.name),
      $("input")({
        class: styles.attrInput,
        type: "text",
        value: $.bind(attr.state),
      })
    );
  }
}

const pluralize = (word, count) => {
  if (count === 1) {
    return word;
  } else {
    return word + "s";
  }
};
