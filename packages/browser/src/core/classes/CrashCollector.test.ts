import { CrashCollector } from "./CrashCollector.js";
import { View } from "./View.js";

test("works", () => {
  const disconnectApp = jest.fn();
  const connectView = jest.fn();

  const HelpfulCrashPage = View.define({
    setup(ctx, m) {
      return m("div", [m("h1", "Something Happened"), m("p", "Something happened.")]);
    },
  });

  const collector = new CrashCollector({
    disconnectApp,
    connectView,
    crashPage: HelpfulCrashPage,
    enableCrashPage: true,
  });

  collector.report(new Error("This is an error that doesn't unmount the app."));

  expect(disconnectApp).not.toHaveBeenCalled();
  expect(connectView).not.toHaveBeenCalled();

  collector.crash({ error: new Error("This unmounts the app."), component: null as any });

  // App disconnects and crash page connects.
  expect(disconnectApp).toHaveBeenCalledTimes(1);
  expect(connectView).toHaveBeenCalledTimes(1);
});
