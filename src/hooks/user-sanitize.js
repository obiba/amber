// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
const xss = require('xss');
const xssOpts = {
  whiteList: {}, // empty, means filter out all tags
  stripIgnoreTag: true, // filter out all HTML not in the whitelist
  stripIgnoreTagBody: ['script'], // the script tag is a special case, we need to filter out its content
};

// eslint-disable-next-line no-unused-vars
module.exports = (options = {}) => {
  return async context => {
    if (context.params.provider) {
      context.data.firstname = context.data.firstname && xss(context.data.firstname, xssOpts);
      context.data.lastname = context.data.lastname && xss(context.data.lastname, xssOpts);
      context.data.institution = context.data.institution && xss(context.data.institution, xssOpts);
      context.data.city = context.data.city && xss(context.data.city, xssOpts);
      context.data.title = context.data.title && xss(context.data.title, xssOpts);
    }
    return context;
  };
};
