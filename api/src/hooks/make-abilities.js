// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

 
const dataApiKey = require('../utils/data-api-key');

module.exports = (defineAbilitiesFor) => {
  return async context => {
    const { user, groups } = context.params;
    let ability;
    if (context.params.dataApiKey) {
      // same read-only abilities, whatever the service
      ability = dataApiKey.defineAbilitiesFor(context.params.dataApiKey);
    } else if (user) {
      ability = defineAbilitiesFor(user, groups);
    } else {
      return context;
    }
    context.params.ability = ability;
    context.params.rules = ability.rules;

    return context;
  };
};
