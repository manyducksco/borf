const _ = require("lodash");

module.exports = function (args, project) {
  let name = _.camelCase(args.name);

  name = name[0].toUpperCase() + name.slice(1);

  return {
    output: `${project.path.app}/components/${name}`, // path is relative to src path

    // variables are available in mustache templates with {{name}} and in file names with [name]
    variables: {
      name,
    },
  };
};
