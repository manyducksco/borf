# TODO

Prepare for v1.0

- Remove all unnecessary features
  - [x] String selectors in state get and map (functions only)
  - [ ] TransitionOut lifecycle hook
  - [x] Deprecated `watchState` in components now that `subscribeTo` exists
  - (consider) loadRoute lifecycle hook; this can make navigation feel slower
  - (consider) `this` binding in service and component functions; take the context as the first parameter instead
- Reconsider if proxy states are a good idea or indicative of some design flaw in the framework.
