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
  const { can, rules } = new AbilityBuilder(createMongoAbility);

  //console.log(user);

  if (user.role === 'administrator') {
    can('manage', 'all');
  } else if (user.role === 'manager') {
    can('manage', 'case-report');
  } else if (user.role === 'interviewer') {
    can('create', 'case-report');
    can('read', 'case-report');
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