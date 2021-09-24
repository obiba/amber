// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {

    const rewriteQuery = (q) => {
      for (let field in q) {
        if(q[field].$search && field.indexOf('$') == -1) {
          q[field] = { $regex: new RegExp(q[field].$search, 'i') };
        }
        if(field === '$or' || field === '$and') {
          q[field].map((action) => {
            return rewriteQuery(action);
          });
        }
      }
      return q;
    };

    const query = context.params.query;
    if (query) {
      context.params.query = rewriteQuery(query);
    }
    
    return context;
  };
};
