# 🏗️ Borf: Build

Build system in a box for Borf projects.

## How to Use

First, install this package in your project as a dev dependency.

```
npm i --save-dev @borf/build
```

Installing this package makes the `bbuild` command (and alias `borf-build`) available in `package.json` scripts:

```json
{
  "scripts": {
    "build": "bbuild --minify",
    "start": "bbuild --watch"
  }
}
```

## Command Line Options

### `--watch` or `-w`

Starts an HTTP server with live reload. Visit this server in your browser to see your app.

### `--minify`

Shortens variable names and removes whitespace in an effort to reduce bundle size as much as possible. Recommended for production builds.

### `--config` or `-c`

Build against a specific config. Takes the path to the desired config file:

```
bbuild -c borf.build.prod.js
bbuild -c borf.build.dev.js
```

## Config File

Build will look for a `borf.build.js` file in your project root by default:

```
project/
  ...
  package.json
  borf.build.js
```

The config file exports a builder configuration. You can create as many of these as you like as separate files and build against a specific one with the `--config` command line option.

```js
import { Builder } from "@borf/build";

export default Builder.configure({
  client: {
    entry: "./client/app.jsx",
  },
  server: {
    entry: "./server/app.ts",
  },
  static: "./static",
});
```

---

🦆
