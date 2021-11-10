declare module "@manyducksco/woof" {
  interface WoofOptions {}

  class Woof {}

  export default function (options?: WoofOptions): Woof;

  export function state();
}
