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

A virtual book structured around the exports of the package. Drill down to each class, function, property, etc. for a detailed writeup in a guide/article style. Should be usable as a reference and as a tutorial. Navigation and showing the structure is important. Inline code examples. Conceptual explanations with metaphors and practical examples. Preferably the examples are editable with outputs that update in real time.

- @borf/browser
  - Concepts
    - Introduction
      - Who is Borf for?
      - Why was Borf created?
        - React re-rendering and hooks annoyances
        - Includes essentials like routing, state management, i18n, and a standard HTTP client
        - ?
      - Inspiration and prior art (because everything is a remix)
        - React
        - Angular (services -> global stores, which spawned local stores inspired by unstated-next)
        - unstated-next
        - Mithril / hyperscript
        - choo
        - Ractive (two way binding and observers)
          - Readables and Writables also coincidentally ended up extremely similar to Svelte stores (and Spring to svelte springs), which apparently is a natural progression if you start with the concepts as expressed in Ractive (the cards didn't fall identically, but we're definitely working with the same deck)
        - SolidJS is also extremely similar, but not a direct inspiration.
    - Components
      - What a component is (a function that takes attributes and returns elements or an object)
      - Views
        - Link to templating for more on how to render content for a view
      - Stores
        - When to use stores vs. keeping state in views
        - Global vs local stores
      - Hooks
    - Built-in stores
      - router
      - http
      - document
      - language
    - Observable state (readable/writable)
      - Link to templating, and especially section on helpers for more on using observable state
  - Exports
    - App
      - Root view
      - Routing
      - Global stores
      - Crash handling
      - Languages and translation
    - Readable & Writable
      - Writable is a superset of Readable
      - One way to create a Writable (new Writable())
      - Various ways to obtain a Readable (.toReadable(), .map(), new Readable(), etc.)
    - Ref
      - When to use ref vs. when to pass attributes (generally prefer attributes)
    - Spring
      - Animating CSS styles
      - Animating component transitions
    - templating
      - JSX
      - m (and external libraries like `htm`)
      - Dynamic attributes
        - Toggling classes
      - Helpers
        - when
        - unless
        - repeat
        - observe
