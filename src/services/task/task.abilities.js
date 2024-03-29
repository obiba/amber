const logger = require('../../logger');
const { AbilityBuilder, createAliasResolver, makeAbilityFromRules } = require('feathers-casl');


// don't forget this, as `read` is used internally
const resolveAction = createAliasResolver({
  update: 'patch',       // define the same rules for update & patch
  read: ['get', 'find'], // use 'read' as a equivalent for 'get' & 'find'
  delete: 'remove'       // use 'delete' or 'remove'
});

const defineRulesFor = (user) => {
  // also see https://casl.js.org/v5/en/guide/define-rules
  const { can, rules } = new AbilityBuilder();

  //console.log(user);

  if (user.role === 'administrator') {
    // administrator can do evil
    can('manage', 'all');
  } else if (user.role === 'manager') {
    // can manage all tasks
    can('manage', 'task');
  } else if (user.role === 'interviewer') {
    // can list all tasks
    can('read', 'task');
  }

  logger.debug('  rules: ' + JSON.stringify(rules, null, '  '));

  return rules;
};

const defineAbilitiesFor = (user) => {
  const rules = defineRulesFor(user);

  return makeAbilityFromRules(rules, { resolveAction });
};

module.exports = {
  defineRulesFor,
  defineAbilitiesFor
};