module.exports = function (args, project) {
  return {
    output: `${project.path.server}/resources/${args.name}`,
    variables: {
      name: args.name,
    },
  };
};
