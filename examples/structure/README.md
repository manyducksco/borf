# New project structure

Project structure is predefined with new build system.

- `app/assets` contains static files that will be copied as-is and served from the server root.
- `app/browser/app.html` is the default entry point for the browser app. Built with vite.
- `app/server/server.[jt]sx?` is the default entry point for the server app.
- `borf.config.[jt]s` is the framework config file.

Built files are stored in the `build` folder. Build folder includes a `manifest.json` which is picked up by the server automatically. This file contains configuration needed to serve a browser app and settings baked in at build time.

Supports TS out of the box for app files without any explicit transpiling.
