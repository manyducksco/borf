// export * from "./State";

export * from "./Source";
export * from "./Components";

import { E } from "./Components";
import { Router } from "./Router";

const router = new Router();

router.on(
  "test/:id",
  (router) => {
    setTimeout(() => {
      router.next(router.params.id);
    }, 500);

    return E("span", {
      children: ["TEMPORARY..."],
    });
  },
  (router, data) => {
    console.log("HELLO", router);

    return E("span", {
      children: ["I AM MOUNTED", data],
    });
  }
);

router.connect("#router-test");
