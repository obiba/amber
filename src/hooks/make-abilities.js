// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = (defineAbilitiesFor) => {
  return async context => {
    const { user, groups } = context.params;
    if (!user) return context;
    const ability = defineAbilitiesFor(user, groups);
    context.params.ability = ability;
    context.params.rules = ability.rules;

    return context;
  };
};
