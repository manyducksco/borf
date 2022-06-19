# `@woofjs/view`

Rapid component development environment for Woof projects.

## How to Use

Install this package in your Woof project, then use it in your `package.json` scripts.

Installing this package makes the `woof-view` command available in scripts.

```json
// package.json
{
  "dependencies": {
    "@woofjs/client": "~0.11.0",
    "@woofjs/view": "~0.1.0"
  },
  "scripts": {
    "view": "woof-view start"
  }
}
```

## Commands

### `start`

Specifies the path to the client bundle entry point. This is where your app is created with `makeApp`.

---

🦆
