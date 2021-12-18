module.exports = function (args, project) {
  return {
    output: `${project.path.blueprints}/${args.name}`,
    variables: {},
    files: [
      {
        path: "blueprint.js",
        create: () => blueprintTemplate(),
      },
      {
        path: "files/[name].txt.mustache",
        create: () => fileTemplate(),
      },
    ],
  };
};

const blueprintTemplate = () => `module.exports = function (args, project) {
  return {
    // all generated files are placed in this directory
    output: \`app/widgets/\${args.name}\`,

    // variables can be used in mustache templates with {{name}} and in file names with [name]
    variables: {
      name: args.name
    }
  }
}
`;

const fileTemplate = () =>
  `This is a blueprint template. You can use variables like {{name}}.

Templates can be used to create any type of file. The resulting file will have the same name without the '.mustache' extension and with variables replaced.

For example, this file's template is '[name].txt.mustache', but the file you're reading now is '{{name}}.txt' because the blueprint defined the 'name' variable as '{{name}}'.`;
