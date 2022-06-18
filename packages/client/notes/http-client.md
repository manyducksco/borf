# HTTP Client Notes

```js
const http = this.getService("@http");

const res = await http.post("/some/url")
  .query("test", "example")
  .header("content-type", "application/json")

  // .headers() is an alias for .header()
  // Setting a header to null will remove it from the request
  .headers("authorization", null)

  // also supports setting multiple headers at once with an object
  .headers({
    "content-type": "application/json",
    "authorization": null
  })

  // treated as JSON - sets "content-type" header to "application/json" unless overridden
  // does not apply if .serialize() is called.
  .body({ data: 5 })

  // sets "content-type" header to "application/x-www-form-urlencoded" unless overridden
  .body(new FormData())

  // replicating the default behavior for JS object bodies
  // serialize processes the body before making the request
  // receives the raw content passed to .body() as first arg and the request object as the second.
  .serialize((body) => {
    return JSON.stringify(body);
  })

  // Parses Response object
  // overrides automatic parsing based on "content-type" header
  // Receives the body as a raw string. Value returned here is the value returned on res.body
  .parse((body) => {
    return body.json();
  });

// Response object has the following structure
// Body is automatically decoded based on content type header when receiving data.
// Content type header is automatically set based on body when sending data.
{
  ok: true,
  status: 200,
  headers: {
    "content-type": "application/json"
  },
  body: {
    user: {
      email: "someguy@hotmail.com",
      avatar: "https://img.host.io/xF8j2f.jpg"
    }
  }
}
```
