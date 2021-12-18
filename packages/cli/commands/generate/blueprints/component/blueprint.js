module.exports = function (args, project) {
  return {
    output: `${project.path.app}/components/${args.name}`, // path is relative to src path

    // variables are available in mustache templates with {{name}} and in file names with [name]
    variables: {
      name: args.name,
    },
  };
};
