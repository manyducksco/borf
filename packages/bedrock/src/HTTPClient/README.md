## HTTPClient

```ts
// IDEA: Basically the Woofe HTTP client.
// An HTTP client with middleware support and an API that fixes things I personally don't care for in the fetch and axios APIs.

class HTTPClient {}

const http = new HTTPClient({
  /* options */
});

const remove = http.use((req, res) => {
  // Middleware is registered for all subsequent requests using this client.

  // Here we are adding authorization to all requests to the same domain (relative paths to the same server).
  if (req.isSameDomain) {
    req.setHeader("authorization", `Bearer ${someAuthToken}`);
  }
});

remove(); // Middleware registration returns a function to unregister.

try {
  // Requests reject when they fail, unlike fetch.
  const response = await http.post({
    url: "/url",
    headers: {
      accept: "application/json",
    },
    body: {
      data: "This is some data in the body",
    },
  });

  console.log(response.body); // JSON body is automatically parsed.
} catch (error) {
  // HTTPRequestError includes additional info about the request.
  console.error(`Request error: ${error.status}: ${error.message}`);
}
```
