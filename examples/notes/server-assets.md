# Server Assets

The server can have components and pages as well, but a server doesn't have the same kind of single index.html entry point. I think we're going to need some kind of Page component that includes the bundled assets.

```jsx
app.get("/some-page", () => {
  // <Page> automatically has the bundled stylesheet included
  return (
    <Page>
      <Head>
        <title>Whatever</title>
      </Head>

      <h1>This is the body</h1>
      <p>Whatever content you want here</p>
    </Page>
  );
});
```

This works through a `static.json` file that references all the bundled assets. The file is created by the build system and imported by the Page component to get the CSS links. This can also include other bundle-generated files in the future.
