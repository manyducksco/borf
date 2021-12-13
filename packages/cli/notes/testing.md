# Testing

There is currently a browser-based test environment for browser components. I wonder if it makes sense to implement the same test framework in Node (without views) for the server components. The server-side tests could run as their own process and send their results to the browser through server-sent events.

- On one server:
  - File watcher for `server/` which runs server side tests and reports results
  - File watcher for `app/` which rebuilds test bundle
    - Tests for `app/` are run in the browser
    - Gets list of server-side tests and requests to run them when visiting their URL (works the same as browser tests, only calls Node process to run and get results)
  - Web server that serves app bundle and mediates with server test runner

Server tests should be shown side by side with app tests (under different heading) and look and work identically.

Could also run all tests in CLI by using JSDOM for the browser parts.