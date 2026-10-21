const { randomBytes, createHash } = require('crypto');
const { AbilityBuilder, createAliasResolver, createMongoAbility } = require('@casl/ability');

const resolveAction = createAliasResolver({
  read: ['get', 'find']
});

/**
 * The key is a random 256 bits value: a plain hash is enough, and it can be looked up.
 */
const hashApiKey = (key) => createHash('sha256').update(key).digest('hex');

const generateApiKey = () => {
  const key = 'amb_' + randomBytes(32).toString('base64url');
  return { key, hash: hashApiKey(key), prefix: key.substring(0, 8) };
};

/**
 * Data extraction only, in the studies of the key.
 */
const defineAbilitiesFor = (dataApiKey) => {
  const { can, build } = new AbilityBuilder(createMongoAbility);
  const studies = dataApiKey.studies;
  can('read', ['case-report', 'interview', 'case-report-form', 'interview-design'], { study: { $in: studies } });
  can('read', 'study', { _id: { $in: studies } });
  // to filter the interviews by campaign: the campaign names only, not their settings (investigators, reminders...)
  can('read', 'campaign', ['_id', 'name', 'study', 'interviewDesign'], { study: { $in: studies } });
  return build({ resolveAction });
};

const inScope = (dataApiKey, study) => dataApiKey.studies.some(s => String(s) === String(study));

module.exports = {
  hashApiKey,
  generateApiKey,
  defineAbilitiesFor,
  inScope
};
