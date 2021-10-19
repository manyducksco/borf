// HTTP calls

http
  .get("/example")
  .cached()
  .header("authorization", "Bearer xxx")
  .auth({ bearer: "xxx" })
  .json() // parse JSON and return an object
  .receive((res) => {
    res.ok; // true if status >= 200 and <= 400
    res.status; // status code
    res.error; // Error object if something crashed
    res.waiting; // true if still waiting for response
    state.set(res.body);
  });

// immediately retriggers any cached GETs to remake request
// if they match the regex
http.invalidate(/example/);

await http.post("/images").body(formData);

// authed copy to chain onto for authed requests
const authed = http
  .auth({ bearer: "xxx" })
  .base("https://mysite.com/api")
  .clone();

// Creates a user, parses the response as JSON, extracts the `userId` and returns it.
const id = authed
  .put("/users")
  .body({
    email: "test@example.com",
    password: "hunter2",
  })
  .json()
  .parse((resBody) => resBody.userId)
  .send();

// Cookie Parser

cookies.get();
cookies.get("some-token");
cookies.set("key", value);
cookies.set({
  cookie1: value2,
  cookie2: value2,
});
const cookie1 = cookies.map((c) => c.cookie1);

// Query parser

query.get();
query.get("param");
query.set("param", value);
query.set({
  page: 2,
  limit: 50,
});
const currentPage = query.map((q) => q.page);
