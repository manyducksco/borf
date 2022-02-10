# Refactor Notes

Goals:

- Make all component mounting async so any component can use the preload lifecycle hook.
- Consolidate makeNode and makeComponent. All of dolla could be regular components instead of nodes.
- (Maybe) change 'component' terminology to 'element'. Things you render should be called elements throughout. Dolla creates elements, you create custom elements.
  - Rename `makeElement` to something else
