# Styles

CSS-in-JS setup for elements. Craft styles as a JS object and apply as class names. When the stylesheet is created it gets added to `document.head` as a `<style>` tag. Style properties are typed.

```js
const styles = new Styles({
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  icon: {
    width: 32,
    height: 32,
  },
  "$.container > $.icon": {
    // styles for an .icon inside a .container ($ references this Styles object)
    backgroundColor: "green",
  },
});

div({
  class: styles.container,
  children: [
    img({
      src: "/my/icon.png",
      class: styles.icon,
    }),
  ],
});
```

And the resulting HTML:

Inside of `<head>`:

```html
<style>
  .container_ef8se2dih {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .icon_h4h1kkidq {
    width: 32px;
    height: 32px;
  }

  .container_ef8se2dih > .icon_h4h1kkidq {
    background-color: "green";
  }
</style>
```

Inside the document:

```html
<div class="container_ef8se2dih">
  <img src="/my/icon.png" class="icon_h4h1kkidq" />
</div>
```
