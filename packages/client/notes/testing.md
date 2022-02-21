```js
import { makeMockHTTP, wrapComponent } from "@woofjs/app/testing";

// Define mock HTTP handlers
const http = makeMockHTTP((self) => {
  self.get("/example/route", (req, res) => {
    res.json({
      message: "success",
    });
  });
});

// Component wrapper now uses mocked HTTP calls
const createComponent = wrapComponent(TestComponent, (self) => {
  self.service("@http", http);
  self.service("name", TestService);
});
```
