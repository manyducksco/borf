import { CrashCollector } from "./CrashCollector.js";

test("works", () => {
  const disconnectApp = jest.fn();
  const connectView = jest.fn();

  class HelpfulCrashPage extends View {
    setup(ctx, m) {
      return m("div", [m("h1", "Something Happened"), m("p", "Something happened.")]);
    }
  }

  const collector = new CrashCollector({
    disconnectApp,
    connectView,
    crashPage: HelpfulCrashPage,
    enableCrashPage: true,
  });

  collector.report(new Error("This is an error that doesn't unmount the app."));

  expect(disconnectApp).not.toHaveBeenCalled();
  expect(connectView).not.toHaveBeenCalled();

  collector.crash(new Error("This unmounts the app."));

  // App disconnects and crash page connects.
  expect(disconnectApp).toHaveBeenCalledTimes(1);
  expect(connectView).toHaveBeenCalledTimes(1);
});
