# Structure Ideas

- App is the top level object for both client and server packages
- App mounts one or more Features
  - Features contain services and routes scoped to that feature
  - Features can be mounted under a path fragment (or "/" by default)
  - Features can be lazy loaded when visited (maybe)
- Services are shared singletons scoped to a Feature and accessed by many Components (+ other Services)
  - Services are instantiated for each request in server side apps
  - Services are instantiated when the app first loads in client side apps
- Routes are Components mounted at specific paths
- Components are groupings of markup, styles and logic

Recommended full stack app structure:

```
/project
  /client
    /features
      /featureName
        /services
        /components
        featureName.js
    client.js
  /server
    /features
      /featureName
        /services
        /components
        featureName.js
    server.js
  woof.config.js
```
