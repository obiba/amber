// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {

    const rewriteQuery = (q) => {
      const now = Date.now();
      const newQuery = {};
      if (q.valid !== undefined) {
        // add participant validity criteria
        if (q.valid === true || q.valid === 'true') {
          newQuery.$and = [
            { activated: true },
            { $or: [{ validFrom: { $exists: false } },  { validFrom: null },  { validFrom: { $lte: now } }] },
            { $or: [{ validUntil: { $exists: false } }, { validUntil: null }, { validUntil: { $gte: now } }] }
          ];
        } else if (q.valid === false || q.valid === 'false') {
          newQuery.$or = [
            { activated: false },
            { $and: [
              { validFrom: { $exists: true } },
              { validFrom: { $ne : null } },
              { validFrom: { $gt: now } }
            ]},
            { $and: [
              { validUntil: { $exists: true } },
              { validUntil: { $ne : null } },
              { validUntil: { $lt: now } }
            ]}
          ];
        }
        // remove this criteria from the query
        delete q.valid;
      }
      return { ...q, ...newQuery };
    };

    const query = context.params.query;
    if (query) {
      context.params.query = rewriteQuery(query);
    }

    return context;
  };
};
