# Testing Tools

Run `woof test` to start test runner UI to visit in browser.
Run `woof start` to run the app locally.
Run `woof build` to create an optimized production build of the app.
Run `woof generate` to generate components and services.

Test runner is a web interface like Storybook that has a section for each component and service and tools for viewing and running tests for those objects. You put tests and views in the same .test.js file and the `test` command will pick them up automatically.

- Auto-reload picks up file changes and reloads parts of the UI

One part frontend woof app:

- Listens for change signals from dev server
- Renders UI
- Runs the tests

One part backend express app:

- Watches files for changes and sends signals to client
- Serves client test runner app
