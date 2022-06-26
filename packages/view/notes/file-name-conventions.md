# View File Naming Conventions

The way view files are named affects how they show up on the navigation panel.

These patterns will be displayed under their folder name (the file name will be chopped)

- `/path/to/Component/Component.view.jsx` -> `/path/to/Component`
- `/path/to/Component/index.view.js` -> `/path/to/Component`

Other patterns will be displayed under their full path, without the `.view.ext` part:

- `/components/SomeComponent.view.ts` -> `/components/SomeComponent`
- `/path/to/Component/Awesome.view.jsx` -> `/path/to/Component/Awesome`
- `/path/to/nested/Component/wooooo.view.tsx` -> `/path/to/nested/Component/wooooo`
