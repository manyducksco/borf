const Outlet = makeComponent(($, self) => {
  const { $attrs, debug, children } = self;

  debug.name = "woof:component:Outlet";
  // TODO: Accept states for attrs not starting with $ - will be watched by the component and values passed on change
  //       States on attrs that do start with $ will be passed as a state.
  //       This way any attribute on components automatically supports states without the component needing to know about it.

  let outlet = $.outlet($attrs.get("component"));

  for (const child of children) {
    debug.log("child", child);
  }

  return outlet;
});

const Route = makeComponent(($, self) => {
  const { $attrs, debug } = self;

  debug.name = "woof:component:Route";

  const $path = $attrs.map("path");
  const $redirect = $attrs.map("redirect");
  const $component = $attrs.map("component");

  self.beforeConnect(() => {
    if ($redirect.get()) {
      debug.log($redirect.get());
    }
  });

  return <div></div>;
});

const RouteComponentsExample = makeComponent(($, self) => {
  self.debug.name = "RouteComponentsExample";

  return (
    <div class="example">
      <Outlet>
        <Route path="top" component={($) => <h1>TOP LEVEL</h1>} />
        <Route
          path="nested/*"
          component={($) => (
            <div>
              <h1>Nested Routes!</h1>
              <Outlet>
                <Route path="one" component={($) => <h1>NESTED #1</h1>} />
                <Route path="two" component={($) => <h1>NESTED #2</h1>} />
                <Route path="*" redirect="/examples" />
              </Outlet>
            </div>
          )}
        />
        <Route path="*" redirect="top" />
      </Outlet>
    </div>
  );
});

export default RouteComponentsExample;
