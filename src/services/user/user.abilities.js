const logger = require('../../logger');
const { AbilityBuilder, createAliasResolver, createMongoAbility } = require('@casl/ability');


// don't forget this, as `read` is used internally
const resolveAction = createAliasResolver({
  update: 'patch',       // define the same rules for update & patch
  read: ['get', 'find'], // use 'read' as a equivalent for 'get' & 'find'
  delete: 'remove'       // use 'delete' or 'remove'
});

const defineRulesFor = (user) => {
  // also see https://casl.js.org/v6/en/guide/define-rules
  const { can, cannot, rules } = new AbilityBuilder(createMongoAbility);

  //console.log(user);

  if (user.role === 'administrator') {
    // administrator can do evil
    can('manage', 'all');
    // no self removal
    cannot('delete', 'user', { _id: user._id });
  } else {
    if (user.role === 'manager' || user.role === 'interviewer') {
      // can list all users
      can('read', 'user');
    } else {
      // can only get itself
      can('read', 'user', { _id: user._id });
    }
    // update own user
    can('update', 'user', { _id: user._id });
    // no self removal
    cannot('delete', 'user', { _id: user._id });
  }

  logger.debug('  rules: ' + JSON.stringify(rules, null, '  '));

  return rules;
};

const defineAbilitiesFor = (user) => {
  const rules = defineRulesFor(user);

  return createMongoAbility(rules, { resolveAction });
};

module.exports = {
  defineRulesFor,
  defineAbilitiesFor
};