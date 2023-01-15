# 🐕🏗️ builde

Build system in a box for [`woofe`](https://www.npmjs.com/package/woofe) and [`growle`](https://www.npmjs.com/package/growle) projects.

## How to Use

First, install this package in your project as a dev dependency.

```
npm i --save-dev builde
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

## Options

### `--watch` or `-w`

Starts an HTTP server with live reload. Visit this server in your browser to see your app.

### `--minify`

Shortens variable names and removes whitespace in an effort to reduce bundle size as much as possible. Recommended for production builds.

## File Structure

Builde expects projects to be organized in a particular way.

```
project/
  client/
    app.jsx
  server/
    app.jsx
  static/
    ...
  package.json
  builde.config.js
```

The entrypoint for a client app should be `client/app.(jsx|tsx|js|ts)` relative to the package.json where this package is installed. The entrypoint for a server app should be `server/app.(jsx|tsx|js|ts)` relative to the package.json where this package is installed. Both entrypoints are optional, but both can also coexist in one project. Static files accessible to both client and server go in the `static` folder.

In this way `builde` works for standalone APIs, standalone SPAs, and monolithic full stack apps with logic on the frontend and supporting routes on the backend.

---

🦆
