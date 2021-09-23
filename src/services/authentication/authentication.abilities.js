const { AbilityBuilder, createAliasResolver, makeAbilityFromRules } = require('feathers-casl');

// don't forget this, as `read` is used internally
const resolveAction = createAliasResolver({
  update: 'patch',       // define the same rules for update & patch
  read: ['get', 'find'], // use 'read' as a equivalent for 'get' & 'find'
  delete: 'remove'       // use 'delete' or 'remove'
});

const defineRulesFor = (user) => {
  // also see https://casl.js.org/v5/en/guide/define-rules
  const { can, cannot, rules } = new AbilityBuilder();

  if (!user) {
    can('create', 'user');
    return rules;
  }

  if (user.role === 'administrator') {
    // administrator can do evil
    can('manage', 'all');
    return rules;
  }

  if (user.role === 'manager') {
    can('read', 'user');
    can('create', 'study');
  }

  // update own user
  can('update', 'user', { id: user.id });
  // except role
  cannot('update', 'user', ['role'], { id: user.id });
  // no self removal
  cannot('delete', 'user', { id: user.id });

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