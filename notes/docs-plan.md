## Table of Concepts

1. Overview
2. Components: Views and Stores
3. State
4. Routing

Outline for future guide:

- Creating a new app
  - Build config and project directories
  - Template project?
- Views
  - m
  - Binding data to DOM elements
  - Binding data to nested components
  - Special views (when, unless, repeat, subscribe)
- Stores
  - Built-in stores
  - Custom stores
  - Accessing stores
- State
  - State methods (get, set, update, merge, subscribe)
  - Binding types (readable, writable)
- Routing
  - Route matching
  - Nested routes
  - Loading states (async setup & loading())
- Animations
  - Spring
  - animateIn / animateOut
- Refs
- Web Components
  - ElementHub
  - Hub-scoped stores
  - Using custom elements inside an App

## IDEA: Reference Guide to Borf

A virtual book structured around the exports of the package. Drill down to each class, function, property, etc. for a detailed writeup in a guide/article style. Should be usable as a reference and as a tutorial. Navigation and showing the structure is important. Inline code examples. Conceptual explanations with metaphors.

- @borf/browser
  - Classes
    - App
      - Root view
      - Routing
      - Stores
      - Crash handling
    - Readable & Writable
    - Ref
    - Spring
      - Animating component transitions
      - Animating CSS styles
  - Markup
    - m
      - HTML
      - views
      - custom elements
      - $helpers
  - Functions
    - asComponentCore
  - Concepts
    - Components
      - Views
      - Stores
    - Observable state
