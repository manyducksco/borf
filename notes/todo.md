# TODO

Prepare for woofe v1.0

- [ ] Add option to remount all layers when routes match.
- [ ] Complete JSX element type definitions
- [ ] Add full doc comments to type definitions
- [x] Decide if we're sticking with 'attrs', change to 'props', or pick another word. Both are abbreviated which I don't like, but both full words are too long to use for such a common thing.
  - We decided to go with 'inputs'
- [ ] Update routing to use `{param}` bracket style and add support for numeric params like `{#id}`
- [ ] Determine if async setup with loading() content can replace router preload.

Problems:

- [ ] CrashHandling example is currently running into a problem when connecting loading() content where Markup is being passed as an attribute to an HTML element.
- [ ] Local stores are not yet fully implemented.
