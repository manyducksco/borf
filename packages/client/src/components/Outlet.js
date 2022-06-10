import { makeComponent } from "../makeComponent";
import { makeRouter } from "@woofjs/router";

const Outlet = makeComponent(($, self) => {
  self.debug.name = "woof:route";

  const $path = self.$attrs.get("$path");
  const routes = self.$attrs.get("routes");

  const node = document.createTextNode("");
  const router = makeRouter();

  for (const route of routes) {
    router.on(route.path, route);
  }

  self.watchState($path, (path) => {
    const match = router.match(path);

    if (match) {
      console.log(match);
    } else {
      self.debug.warn(
        `No route was matched for path '${path}'. Consider adding a wildcard ('*') route or redirect to catch this.`
      );
    }
  });

  return node;
});

export default Outlet;
