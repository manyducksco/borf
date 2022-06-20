# `@woofjs/build`

Build system in a box for Woof projects.

## How to Use

First, install this package in your Woof project as a dev dependency.

```
npm i --save-dev @woofjs/build
```

Installing this package makes the `woof-build` command available in `package.json` scripts:

```json
{
  "scripts": {
    "build": "woof-build -c path/to/entry.js -o build --minify",
    "start": "woof-build -c path/to/entry.js -o build --watch"
  }
}
```

## Options

### `--client` or `-c`

Specifies the path to the client bundle entry point. This is where your app is created with `makeApp`.

### `--output` or `-o`

Specifies the folder where bundled files will go.

### `--watch` or `-w`

Starts an HTTP server with live reload. Visit this server in your browser to see your app.

### `--minify`

Shortens variable names and removes whitespace in an effort to reduce bundle size as much as possible. Recommended for production builds.

---

🦆
