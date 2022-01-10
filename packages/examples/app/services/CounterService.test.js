import { makeSuite, wrapService } from "@woofjs/app/testing";
import CounterService from "./CounterService.js";

export default makeSuite((test) => {
  const makeCounterService = wrapService(CounterService);

  test("uh", (t) => {
    t.same(1, 1);
    t.same(2, 1);
  });
});
