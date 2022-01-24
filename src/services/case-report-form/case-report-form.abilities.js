const logger = require('../../logger');
const { AbilityBuilder, createAliasResolver, makeAbilityFromRules } = require('feathers-casl');


// don't forget this, as `read` is used internally
const resolveAction = createAliasResolver({
  update: 'patch',       // define the same rules for update & patch
  read: ['get', 'find'], // use 'read' as a equivalent for 'get' & 'find'
  delete: 'remove'       // use 'delete' or 'remove'
});

const defineRulesFor = (user, groups) => {
  // also see https://casl.js.org/v5/en/guide/define-rules
  const { can, rules } = new AbilityBuilder();

  //console.log(user);

  if (user.role === 'administrator') {
    can('manage', 'all');
  } else if (user.role === 'manager') {
    can('manage', 'case-report-form');
  } else if (user.role === 'interviewer') {
    // unrestricted access
    can('read', 'case-report-form', { permissions: { $exists: false, $eq: null } });
    // restricted access to users and groups
    const hasPermissionsCriterion = { $exists: true, $ne: null };
    can('read', 'case-report-form', { permissions: hasPermissionsCriterion, 'permissions.users': user._id });
    if (groups) {
      groups.forEach(group => can('read', 'case-report-form', { permissions: hasPermissionsCriterion, 'permissions.groups': group._id }));
    }
  }
  logger.debug('  rules: ' + JSON.stringify(rules, null, '  '));

  return rules;
};

const defineAbilitiesFor = (user, groups) => {
  const rules = defineRulesFor(user, groups);

  return makeAbilityFromRules(rules, { resolveAction });
};

module.exports = {
  defineRulesFor,
  defineAbilitiesFor
};