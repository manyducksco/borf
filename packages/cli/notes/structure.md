# Project Structure

The Woof CLI expects a certain project structure. That is:

```
project_dir/
  - app/
    - components/
    - services/
    - app.js
  - blueprints/ (optional)
  - server/
    - middleware/
    - resources/
    - services/
    - server.js
  - woof.config.js (commonjs module that exports an object)
```

## Concept

Frontend and backend have the same structure, but Routes are mounted to respond to requests on the server, while Components are mounted to display something on the client side.

Services work exactly the same way in app and server. Routes can be thought of as data components.