module.exports = function (args, project) {
  return {
    output: `${project.path.src}/components/${args.name}`, // path is relative to src path
    files: [
      // each file in this array is written to `output` directory above.
      {
        path: "index.js",
        create: () => indexTemplate(args.name),
      },
      {
        path: `${args.name}.js`,
        create: () => componentTemplate(args.name),
      },
      {
        path: `${args.name}.miru.js`,
        create: () => testTemplate(args.name),
      },
    ],
  };
};

const indexTemplate = (name) => `import { ${name} } from "./${name}";

export default ${name};
`;

const componentTemplate = (
  name
) => `import { Component } from "@manyducksco/woof";

export class ${name} extends Component {
  createElement($) {
    return $("div")("${name}");
  }
}
`;

const testTemplate = (
  name
) => `import { suite, wrap } from "@manyducksco/woof/test";
import { ${name} } from "./${name}";

export default suite(({ view, test }) => {
  const createComponent = wrap(${name}).create();

  view("default", ($, { attr }) => {
    return createComponent({
      /* ... attributes ... */
    });
  });

  test("is implemented", (t) => {
    t.assert(false, "is implemented");
  });
});
`;
