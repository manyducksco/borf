// export * from "./State";

export * from "./Source";
export * from "./Components";

import { E } from "./Components";
import { Router } from "./Router";

const router = new Router();

router.on(
  "test/:id",
  (route) => {
    // setTimeout(() => {
    //   route.next(route.params.id);
    // }, 500);

    return E("span", {
      children: [
        "TEMPORARY...",
        E("button", {
          onClick: () => {
            route.next(route.params.id);
          },
          children: ["Click for next route"],
        }),
      ],
    });
  },
  (route, data) => {
    console.log("HELLO", route);

    return E("span", {
      children: [
        "I AM MOUNTED: ",
        data,
        route.switch([
          [
            "edit",
            (route) => {
              return E("span", { children: [route.path] });
            },
          ],
          [
            "*",
            (route) => {
              console.log(route);
              route.redirect("edit", { replace: true });
            },
          ],
        ]),
      ],
    });
  }
);

router.connect("#router-test");
