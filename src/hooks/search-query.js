// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {

    const query = context.params.query;
    if (query) {
      for (let field in query) {
        if(query[field].$search && field.indexOf('$') == -1) {
          query[field] = { $regex: new RegExp(query[field].$search, 'i') };
        }
        if(field == '$or') {
          query[field].map((action) => {
            let f = Object.keys(action)[0];
            if(action[f].$search) {
              action[f] = { $regex: new RegExp(action[f].$search, 'i') };
            }
            return action;
          });
        }
      }
      context.params.query = query;
    }
    
    return context;
  };
};
