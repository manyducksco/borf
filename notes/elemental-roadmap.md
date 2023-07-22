# Elemental Roadmap

Elemental started as a way to do custom HTML elements quickly.
I'm thinking of expanding it into a full-fledged framework with routing and state management.
First it would need an optional router. Maybe this could be a standalone thing that isn't necessarily part of elemental.
Second it would need stores, or another mechanism of keeping app-level state that can be used by many components simultaneously.

The example below depicts a router with two routes. All is encapsulated inside a `core-store` to share state between pages. The `/` route has a guard function that only lets you through if you are logged in according to the state inside the `core-store`.

```js
html`
  <core-store>
    <e-router>
      <e-route
        path="/"
        guard=${(c) => {
          if (!c.store("core-store").isLoggedIn) {
            c.redirect("/login");
          }
        }}
      >
        <home-view></home-view>
      </e-route>
      <e-route path="/login">
        <login-view></login-view>
      </e-route>
      <e-route path="*" redirect="/"></e-route>
    </e-router>
  </core-store>
`;
```
