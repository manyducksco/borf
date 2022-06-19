# `@woofjs/build`

Build system in a box for Woof projects.

## How to Use

Install this package in your Woof project, then use it in your `package.json` scripts.

Installing this package makes the `woof-build` command available in scripts.

```json
// package.json
{
  "dependencies": {
    "@woofjs/client": "~0.11.0",
    "@woofjs/build": "~0.1.0"
  }
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
