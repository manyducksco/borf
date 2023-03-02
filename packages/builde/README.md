# 🏗️ Frameworke: Builde

Build system in a box for Frameworke projects.

## How to Use

First, install this package in your project as a dev dependency.

```
npm i --save-dev @frameworke/builde
```

Installing this package makes the `builde` command available in `package.json` scripts:

```json
{
  "scripts": {
    "build": "builde --minify",
    "start": "builde --watch"
  }
}
```

## Command Line Options

### `--watch` or `-w`

Starts an HTTP server with live reload. Visit this server in your browser to see your app.

### `--minify`

Shortens variable names and removes whitespace in an effort to reduce bundle size as much as possible. Recommended for production builds.

## Config File

Builde expects to find a `builde.js` file in your project root:

```
project/
  ...
  package.json
  builde.js
```

In the config file, the builder is configured:

```js
import { Builder } from "@frameworke/builde";

export default Builder.config({
  frontend: "./client/app.jsx",
  backend: "./server/app.js",
  static: "./static",
});
```

---

🦆
