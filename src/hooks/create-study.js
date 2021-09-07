// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    const { data } = context;

    // Throw an error if we didn't get a name
    if(!data.name) {
      throw new Error('A study must have a name');
    }

    // The logged in user
    const { user } = context.params;
    
    // Update the original data (so that people can't submit additional stuff)
    context.data = {
      name: data.name,
      // Set the user id
      createdBy: user._id,
      // Add the current date
      createdAt: new Date().getTime()
    };
    
    return context;
  };
};
