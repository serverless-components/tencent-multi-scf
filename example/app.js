exports.index = async (event, context) => {
  return {
    msg: 'Hello Serverless',
  };
};

exports.userList = async (event, context) => {
  return [
    {
      id: 1,
      name: 'test',
    },
  ];
};
