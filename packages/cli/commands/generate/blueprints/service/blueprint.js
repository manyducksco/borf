const _ = require("lodash");

module.exports = function (args, project) {
  let name = _.camelCase(args.name);

  name = name[0].toUpperCase() + name.slice(1);
  if (!/service$/i.test(name)) {
    name += "Service";
  }

  return {
    output: `${project.path.app}/services/${name}`,
    variables: {
      name,
    },
  };
};
