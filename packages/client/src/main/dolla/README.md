# Woof Templating

> Dolla dolla bill, y'all.
>
> &mdash; Wu Tang Clan

```js
const h1 = $("h1");
h1({ class: "header" }, "Hi there.");
```

```js
$("ul");
$("table");
$("form");
```

```js
$("button", {
  class: "delete-btn",
  onclick: () => {
    alert("You have been deleted.");
  },
});
```

```js
$("div")(attrs, ...children);

// returns
{
  tag: "div",
  attrs: {},
  component: Component, // instance of component
  children: [
    {
      tag: "ul",
      attrs: {},
      component: Component,
      children: [/* and so on */]
    }
  ]
}

// Component gets lifecycle hooks called by the renderer as appropriate

// Render into HTML by reading tag and attrs
// Render into DOM by creating element from tag


```
