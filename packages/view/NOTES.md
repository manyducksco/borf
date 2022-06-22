# Notes

How does it work?

- Finds all files in the project ending in `.view.js` (or `.jsx`, `.ts`, `.tsx`)
- Generate ate an index file that imports all of these, exports some kind of data structure
- Runner app is prebuilt, loads the data structure from window? Runner doesn't have to change -- just the view index
- Views rendered inside an iframe

```js
const index = {
  tree: [
    {
      name: "components",

      // If the object has 'children', it's a folder
      children: [
        {
          name: "MyComponent",

          // If the object has 'views', it's a collection
          views: [
            {
              name: "name",
              description: "description",
              attributes: [],
              services: {},
              actions: [],
              template: fn,
            },
          ],
        },
      ],
    },
  ],
};
```
