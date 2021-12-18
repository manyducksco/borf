module.exports = function (args, project) {
  return {
    output: `${project.path.app}/services/${args.name}`,
    variables: {
      name: args.name,
    },
  };
};
