import test from "ava";
import sinon from "sinon";
import { CrashCollector } from "./CrashCollector.js";

test("works", (t) => {
  const disconnectApp = sinon.fake();

  const collector = new CrashCollector();

  collector.onError((ctx) => {
    if (ctx.severity === "crash") {
      disconnectApp();
    }
  });

  collector.error({ error: new Error("This is an error that doesn't unmount the app."), component: null as any });

  t.assert(disconnectApp.called === false);

  collector.crash({ error: new Error("This unmounts the app."), component: null as any });

  // App disconnects and crash page connects.
  t.assert(disconnectApp.calledOnce);
});
