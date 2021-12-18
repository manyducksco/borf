module.exports = function (args, project) {
  return {
    output: `${project.path.blueprints}/${args.name}`,
    variables: {},
    files: [
      {
        path: "blueprint.js",
        create: () => blueprintTemplate(args),
      },
      {
        path: "files/[name].txt.mustache",
        create: () => fileTemplate(),
      },
    ],
  };
};

const blueprintTemplate = (args) => `/**
 * Generates ${args.name} boilerplate from mustache templates.
 * 
 * For a rundown of mustache, see https://mustache.github.io/mustache.5.html
 * 
 * @param args - An object of parsed command line arguments this blueprint was called with
 * @param project - The top-level woof config for this project
 */
module.exports = function (args, project) {
  return {
    // all generated files are placed relative to this directory
    output: \`app/widgets/\${args.name}\`,

    // variables can be referenced in file names with [name] and in mustache templates with {{name}}
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
