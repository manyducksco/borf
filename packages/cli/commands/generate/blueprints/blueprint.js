module.exports = function (args) {
  return {
    output: "blueprints",
    files: [
      {
        path: args.name + ".js",
        create: () => template(args.name),
      },
    ],
  };
};

const template = (name) => `module.exports = function (args, project) {
  return {
    output: project.path.src + "/${name}",
    files: [
      {
        path: args.name + ".js",
        create: () => "Hello world!"
      }
    ]
  }
};
`;
