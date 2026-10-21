// Cleanup of the interview step actions recorded before the actions were the step state changes only:
// - the intermediate saves were recorded as 'pause': of each series of consecutive 'pause',
//   only the last one is kept (a pause in the middle of a series cannot be told from a save)
// - a step was 'complete' again when sent again: only the first of consecutive 'complete' is kept
// - the 'init' action was missing: it is added with the time of the first action
//
// The steps which actions start with 'init' (recorded since the fix, or cleaned) are left as is,
// so the script can be run more than once.
//
// Usage (backup the database first):
//   mongosh "mongodb://localhost:27017/amber" scripts/cleanup-interview-actions.js
// Set DRY_RUN=true to only report the changes.

const dryRun = process.env.DRY_RUN === 'true';

function cleanActions (actions) {
  if (actions.length === 0 || actions[0].type === 'init') return actions;
  const rval = [];
  actions.forEach((action, i) => {
    const prev = rval[rval.length - 1];
    if (action.type === 'pause' && actions[i + 1]?.type === 'pause') return;
    if (action.type === 'complete' && prev?.type === 'complete') return;
    rval.push(action);
  });
  rval.unshift({ type: 'init', user: actions[0].user, timestamp: actions[0].timestamp });
  return rval;
}

let interviews = 0, removed = 0;
const ops = [];
db.interviews.find({ 'steps.0': { $exists: true } }, { steps: 1 }).forEach((itw) => {
  let changed = false;
  const set = {};
  itw.steps.forEach((step, i) => {
    const actions = step.actions || [];
    const cleaned = cleanActions(actions);
    if (cleaned !== actions) {
      changed = true;
      removed += actions.length - cleaned.length + 1;
      set[`steps.${i}.actions`] = cleaned;
    }
  });
  if (changed) {
    interviews++;
    ops.push({ updateOne: { filter: { _id: itw._id }, update: { $set: set } } });
  }
});

if (!dryRun && ops.length > 0) {
  for (let i = 0; i < ops.length; i += 1000) {
    db.interviews.bulkWrite(ops.slice(i, i + 1000));
  }
}
print(`${dryRun ? '[dry run] ' : ''}${interviews} interviews cleaned, ${removed} actions removed (init added)`);
