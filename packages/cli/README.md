# @woofjs/cli

Command line interface for Woof apps. Bundles a build system, test runner and other necessities so you can stay focused on making your app.

## Create a Project

> Not yet implemented. See [examples project](https://github.com/woofjs/examples) as a starting point.

## Run a Project

```
woof start
```

Opens the project in your default web browser (or `--no-browser`) and auto-reloads when you save project files.

## Run Tests and Views

```
woof test
```

Opens a browser-based test runner that supports traditional unit testing for services and components, plus [Storybook](https://storybook.js.org/)-like visual tests called _views_ where you can interact with a component in isolation.

## Create a Build

```
woof build
```

Builds an optimized production version of the app and writes it to the `build` folder. This can be deployed to your favorite web app hosting environment.

## Generate Project Files

```
woof generate <blueprint> <name>
```

Generates project files for repetitive structure like components and services from templates called blueprints. By using [Mustache]() templates and a few well chosen command line arguments, you can achieve a 97% reduction in copy-and-pasting directories and typing a lot.

Create new blueprints or override the built-in ones with `woof generate blueprint <name>`.

See `woof generate --help` for more, and:

## List Available Blueprints

```
woof blueprints
```

Shows a list of blueprints you can use with `woof generate`.

---

🦆
