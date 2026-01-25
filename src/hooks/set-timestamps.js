/**
 * Hook to automatically set timestamp fields (before hook)
 * 
 * - On create: sets createdAt and updatedAt
 * - On update/patch: sets updatedAt only
 */

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return (context) => {
    const now = new Date();

    if (context.method === 'create') {
      if (Array.isArray(context.data)) {
        context.data.forEach(item => {
          item.createdAt = now;
          item.updatedAt = now;
        });
      } else {
        context.data.createdAt = now;
        context.data.updatedAt = now;
      }
    } else if (context.method === 'update' || context.method === 'patch') {
      if (Array.isArray(context.data)) {
        context.data.forEach(item => {
          item.updatedAt = now;
        });
      } else {
        context.data.updatedAt = now;
      }
    }

    return context;
  };
};
