exports.index = async (event, context) => {
  return {
    msg: 'Hello Serverless',
    event: event,
  };
};
