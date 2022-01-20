import { makeComponent, mergeStates } from "@woofjs/app";

export default makeComponent(($, self) => {
  const testbed = self.getService("testbed");

  const $query = self.$route.map("query");
  const $params = self.$route.map("params");
  const $currentView = $query.map("view");

  return (
    <div class="sidebar">
      <ul>
        {$.each(
          testbed.$suites,
          (suite) => suite.path,
          (suite) => {
            return (
              <li>
                <a
                  href={"/" + suite.path}
                  class={{
                    link: true,
                    linkActive: mergeStates(
                      $currentView,
                      $params,
                      (current, params) =>
                        current == null && params.wildcard === suite.path
                    ),
                  }}
                >
                  {suite.path}
                </a>

                {suite.views.length > 0 && (
                  <ul>
                    {$.each(
                      suite.views,
                      (view) => view.name,
                      (view) => (
                        <li>
                          <a
                            class={{
                              link: true,
                              viewLink: true,
                              viewLinkActive: mergeStates(
                                $currentView,
                                $params,
                                (current, params) =>
                                  current === view.name &&
                                  params.wildcard === suite.path
                              ),
                            }}
                            href={
                              "/" +
                              suite.path +
                              "?view=" +
                              encodeURIComponent(view.name)
                            }
                          >
                            🌆 {view.name}
                          </a>
                        </li>
                      )
                    )}
                  </ul>
                )}
              </li>
            );
          }
        )}
      </ul>
    </div>
  );
});
