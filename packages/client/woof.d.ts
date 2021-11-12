declare module "@manyducksco/woof" {
  interface AppOptions {}

  class App {}

  /**
   * Creates a new app.
   *
   * @param options - Customize your app with an options object. `hash: true` for hash routing.
   */
  export default function (options?: AppOptions): App;

  export function state();
}
