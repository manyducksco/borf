import { Component, Styles, combineStates } from "@manyducksco/woof";

const styles = new Styles({
  sidebar: {
    display: "flex",
    flexFlow: "column nowrap",
    borderRight: "1px solid #999",
    paddingTop: "0.4em",
  },
  link: {
    display: "flex",
    alignItems: "center",
    borderBottom: "1px dotted #999",
    color: "blue",
    textDecoration: "none",
    padding: "0.1em 0.5em",
    lineHeight: "18px",
  },
  linkActive: {
    backgroundColor: "blue",
    color: "white",
  },
  viewLink: {
    paddingLeft: "1em",
  },
  viewLinkActive: {
    backgroundColor: "cornflowerblue",
    color: "white",
  },
});

export default class Sidebar extends Component {
  createElement($) {
    const { query, params } = this.service("@router");
    const testbed = this.service("testbed");

    const currentView = query.map((q) => q.view || null);

    return $("div")(
      { class: styles.sidebar },
      $("ul")(
        $.map(
          testbed.suites,
          (suite) => suite.path,
          (suite) => {
            return $("li")(
              $("a")(
                {
                  href: "/" + suite.path,
                  class: {
                    [styles.link]: true,
                    [styles.linkActive]: combineStates(
                      currentView,
                      params,
                      (current, params) =>
                        current == null && params.wildcard === suite.path
                    ),
                  },
                },
                suite.path
              ),
              $.if(suite.views.length > 0, () =>
                $("ul")(
                  $.map(
                    suite.views,
                    (view) => view.name,
                    (view) =>
                      $("li")(
                        $("a")(
                          {
                            class: {
                              [styles.link]: true,
                              [styles.viewLink]: true,
                              [styles.viewLinkActive]: combineStates(
                                currentView,
                                params,
                                (current, params) =>
                                  current === view.name &&
                                  params.wildcard === suite.path
                              ),
                            },
                            href:
                              "/" +
                              suite.path +
                              "?view=" +
                              encodeURIComponent(view.name),
                          },
                          "🌆 ",
                          view.name
                        )
                      )
                  )
                )
              )
            );
          }
        )
      )
    );
  }
}
