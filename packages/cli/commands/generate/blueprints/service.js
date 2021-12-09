module.exports = function (args, project) {
  return {
    output: `services/${args.name}`,
    files: [
      {
        path: "index.js",
        create: () => indexTemplate(args.name),
      },
      {
        path: `${args.name}.js`,
        create: () => serviceTemplate(args.name),
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

const serviceTemplate = (name) => `import { Service } from "@manyducksco/woof";

export class ${name} extends Service {
  _created() {

  }
}
`;

const testTemplate = (
  name
) => `import { suite, wrap, MockHTTP } from "@manyducksco/woof/test";
import { ${name} } from "./${name}";

export default suite(({ test }) => {
  const http = new MockHTTP();

  http.get("/mock/route", (req, res, ctx) => {
    res(ctx.json({
      message: "replace me"
    }));
  });

  const createService = wrap(${name})
    .service("@http", http.service)
    .create();

  test("is implemented", (t) => {
    const service = createService();
  
    t.assert(false);
  });
})

`;
