/**
 * A really contrived header that makes an HTTP call to get the user's name.
 */
export function MyHeader() {
  this.defaultState = {
    greeting: "Hello",
    name: "Friend",
  };

  const http = this.global("http");
  const onclick = this.get("onclick");

  this.beforeConnect(() => {
    http.get("/users/me").then((res) => {
      this.set("name", res.body.name);
    });
  });

  return (
    <h1 onclick={onclick}>
      {this.map("greeting")}, {this.map("name")}
    </h1>
  );
}
