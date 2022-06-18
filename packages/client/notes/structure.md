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

## Building Projects

Right now I have `@woofjs/cli` as the place where all the build scripts go. Considering pulling this out into a separate npm package.

```
woof-build --client client/client.js --server server/server.js --output dist
```

You would install `@woofjs/build` in your project and create a script like above in your package.json. Point it to your entry-point files and it would do the rest.

```
woof-build --client client/client.js --serve
```

The above command would run the frontend and start a web server for development. This automatically watches and rebuilds when files change.

## Testing Projects

```
woof-test path/to/file.js --coverage
```

Visual tests with views are supported in the browser runner. This will start an HTTP server you can visit in your browser to interact with views and see test results. Automatically reloads as you change files.

```
woof-test path/to/file.js --runner browser
```
