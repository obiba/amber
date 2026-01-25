# ObjectId Migration Plan - Feathers v5 Resolvers

## Problem Statement

After migrating from Feathers v4 (with `feathers-mongoose`) to Feathers v5 (with `@feathersjs/mongodb`), ObjectId reference fields (like `study`, `createdBy`, `interviewDesign`, etc.) are being stored as **strings** instead of **MongoDB ObjectId** type.

### Why This Happens

- **Mongoose** automatically converted string IDs to `ObjectId` objects based on schema definitions
- **`@feathersjs/mongodb`** is a thin wrapper over the native MongoDB driver and does **not** perform any automatic type conversion - it stores values exactly as received

### Current State

- 13 models with ~40+ ObjectId reference fields across the codebase
- The old Mongoose models in `src/models/` are **orphaned** (not actively used)
- Services now use `LazyMongoDBService` extending `@feathersjs/mongodb`
- No ObjectId conversion is happening anywhere in the data flow
- Existing data likely has a mix of:
  - **Old data**: Proper `ObjectId` types (from Mongoose era)
  - **New data**: String types (post-migration)

---

## Solution: Feathers v5 Resolvers

Implement the full Feathers v5 schema/resolver infrastructure to properly convert string IDs to MongoDB ObjectId types on create/update/patch operations and in queries.

### Features

- ✅ Handle nested ObjectId fields (e.g., `steps[].form`, `permissions.users`)
- ✅ Both data and query ObjectId resolution
- ✅ Reversible data migration script for existing data

---

## Implementation Summary

| Item | Count |
|------|-------|
| New files to create | 13 |
| Files to modify | 12 |
| Services affected | 11 |
| Total ObjectId fields | ~40+ |

---

## New Files to Create

| File | Purpose |
|------|---------|
| `src/validators.js` | AJV validators with ObjectId keyword |
| `src/resolvers/index.js` | Shared resolver utilities |
| `src/services/audit/audit.resolvers.js` | Audit service resolvers |
| `src/services/campaign/campaign.resolvers.js` | Campaign service resolvers |
| `src/services/case-report/case-report.resolvers.js` | Case report service resolvers |
| `src/services/case-report-form/case-report-form.resolvers.js` | Case report form service resolvers |
| `src/services/form/form.resolvers.js` | Form service resolvers |
| `src/services/form-revision/form-revision.resolvers.js` | Form revision service resolvers |
| `src/services/group/group.resolvers.js` | Group service resolvers |
| `src/services/interview/interview.resolvers.js` | Interview service resolvers |
| `src/services/interview-design/interview-design.resolvers.js` | Interview design service resolvers |
| `src/services/participant/participant.resolvers.js` | Participant service resolvers |
| `src/services/study/study.resolvers.js` | Study service resolvers |

---

## Files to Modify

| File | Changes |
|------|---------|
| `package.json` | Add `@feathersjs/schema` |
| `src/services/audit/audit.hooks.js` | Add resolver hooks |
| `src/services/campaign/campaign.hooks.js` | Add resolver hooks |
| `src/services/case-report/case-report.hooks.js` | Add resolver hooks |
| `src/services/case-report-form/case-report-form.hooks.js` | Add resolver hooks |
| `src/services/form/form.hooks.js` | Add resolver hooks |
| `src/services/form-revision/form-revision.hooks.js` | Add resolver hooks |
| `src/services/group/group.hooks.js` | Add resolver hooks |
| `src/services/interview/interview.hooks.js` | Add resolver hooks |
| `src/services/interview-design/interview-design.hooks.js` | Add resolver hooks |
| `src/services/participant/participant.hooks.js` | Add resolver hooks |
| `src/services/study/study.hooks.js` | Add resolver hooks |

---

## ObjectId Field Reference by Service

| Service | ObjectId Fields | Array ObjectId Fields |
|---------|-----------------|----------------------|
| `audit` | `accessedBy` | - |
| `campaign` | `interviewDesign`, `study`, `createdBy` | `investigators`, `supporters` |
| `case-report` | `createdBy`, `caseReportForm`, `study`, `form` | - |
| `case-report-form` | `createdBy`, `study`, `form` | `permissions.users`, `permissions.groups` |
| `form` | `createdBy`, `study` | - |
| `form-revision` | `publishedBy`, `study`, `form` | - |
| `group` | - | `users` |
| `interview` | `participant`, `createdBy`, `campaign`, `interviewDesign`, `study` | `steps[].form` (nested) |
| `interview-design` | `createdBy`, `study` | `permissions.users`, `permissions.groups`, `steps[].form` |
| `participant` | `createdBy`, `study`, `interviewDesign`, `campaign` | - |
| `study` | `createdBy` | `forms` |

---

## Implementation Details

### 1. Install Dependencies

```bash
npm install @feathersjs/schema
```

### 2. Create `src/validators.js`

```javascript
const { Ajv } = require('@feathersjs/schema');
const { keywordObjectId } = require('@feathersjs/mongodb');

// Data validator - strict validation
const dataValidator = new Ajv({
  allErrors: true,
  useDefaults: true
});
dataValidator.addKeyword(keywordObjectId);

// Query validator - with type coercion for query strings  
const queryValidator = new Ajv({
  coerceTypes: true,
  allErrors: true
});
queryValidator.addKeyword(keywordObjectId);

module.exports = { dataValidator, queryValidator };
```

### 3. Create `src/resolvers/index.js`

```javascript
const { resolve } = require('@feathersjs/schema');
const { resolveObjectId, resolveQueryObjectId } = require('@feathersjs/mongodb');
const { ObjectId } = require('mongodb');

/**
 * Converts a value to ObjectId if it's a valid ObjectId string
 * @param {any} value - The value to convert
 * @returns {ObjectId|any} - ObjectId or original value
 */
const toObjectId = (value) => {
  if (!value) return value;
  if (value instanceof ObjectId) return value;
  if (typeof value === 'string' && /^[a-fA-F0-9]{24}$/.test(value)) {
    return new ObjectId(value);
  }
  return value;
};

/**
 * Converts an array of values to ObjectIds
 * @param {any[]} arr - Array of values
 * @returns {ObjectId[]|any[]} - Array of ObjectIds or original array
 */
const toObjectIdArray = (arr) => {
  if (!Array.isArray(arr)) return arr;
  return arr.map(toObjectId);
};

/**
 * Creates a resolver for nested permissions object with users and groups arrays
 * @param {object} value - The permissions object
 * @returns {object} - Permissions with ObjectId arrays
 */
const resolvePermissions = (value) => {
  if (!value) return value;
  return {
    ...value,
    users: value.users ? toObjectIdArray(value.users) : [],
    groups: value.groups ? toObjectIdArray(value.groups) : []
  };
};

/**
 * Creates a resolver for steps array with nested form ObjectId
 * @param {object[]} steps - Array of step objects
 * @returns {object[]} - Steps with ObjectId form fields
 */
const resolveSteps = (steps) => {
  if (!Array.isArray(steps)) return steps;
  return steps.map(step => ({
    ...step,
    form: step.form ? toObjectId(step.form) : step.form
  }));
};

module.exports = {
  resolve,
  resolveObjectId,
  resolveQueryObjectId,
  toObjectId,
  toObjectIdArray,
  resolvePermissions,
  resolveSteps
};
```

### 4. Example Service Resolver (Campaign)

**`src/services/campaign/campaign.resolvers.js`**:

```javascript
const { resolve } = require('@feathersjs/schema');
const { resolveObjectId, resolveQueryObjectId } = require('@feathersjs/mongodb');
const { toObjectIdArray } = require('../../resolvers');

// Resolver for create/update/patch data
const campaignDataResolver = resolve({
  interviewDesign: resolveObjectId,
  study: resolveObjectId,
  createdBy: resolveObjectId,
  investigators: async (value) => toObjectIdArray(value),
  supporters: async (value) => toObjectIdArray(value)
});

// Resolver for queries
const campaignQueryResolver = resolve({
  _id: resolveQueryObjectId,
  interviewDesign: resolveQueryObjectId,
  study: resolveQueryObjectId,
  createdBy: resolveQueryObjectId,
  investigators: resolveQueryObjectId,
  supporters: resolveQueryObjectId
});

module.exports = {
  campaignDataResolver,
  campaignQueryResolver
};
```

### 5. Example Hooks Update (Campaign)

**`src/services/campaign/campaign.hooks.js`** (modified):

```javascript
const { authenticate } = require('@feathersjs/authentication').hooks;
const { authorize } = require('feathers-casl');
const { hooks: schemaHooks } = require('@feathersjs/schema');
const { defineAbilitiesFor } = require('./campaign.abilities');

const makeAbilities = require('../../hooks/make-abilities');
const campaignCreate = require('../../hooks/campaign-create');
const searchQuery = require('../../hooks/search-query');
const campaignRemoveParticipants = require('../../hooks/campaign-remove-participants');
const { campaignDataResolver, campaignQueryResolver } = require('./campaign.resolvers');

module.exports = {
  before: {
    all: [
      authenticate('jwt'),
      makeAbilities(defineAbilitiesFor)
    ],
    find: [
      searchQuery(),
      schemaHooks.resolveQuery(campaignQueryResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    get: [
      schemaHooks.resolveQuery(campaignQueryResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    create: [
      schemaHooks.resolveData(campaignDataResolver),
      campaignCreate(),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    update: [
      schemaHooks.resolveData(campaignDataResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    patch: [
      schemaHooks.resolveData(campaignDataResolver),
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    remove: [
      authorize({ adapter: '@feathersjs/mongodb' }),
      campaignRemoveParticipants()
    ]
  },

  after: {
    all: [
      authorize({ adapter: '@feathersjs/mongodb' })
    ],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
```

### 6. Nested Field Handling Strategy

For nested ObjectId fields like `steps[].form`, we use custom resolver functions:

```javascript
// Example for interview-design steps[].form
const { resolveSteps, resolvePermissions } = require('../../resolvers');

const interviewDesignDataResolver = resolve({
  createdBy: resolveObjectId,
  study: resolveObjectId,
  steps: async (value) => resolveSteps(value),
  permissions: async (value) => resolvePermissions(value)
});
```

### 7. Query Resolution

For queries, `resolveQueryObjectId` handles:
- Direct ID queries: `{ study: '507f1f77bcf86cd799439011' }`
- `$in` queries: `{ study: { $in: ['id1', 'id2'] } }`
- `$nin` queries: `{ study: { $nin: ['id1'] } }`
- `$ne` queries: `{ study: { $ne: 'id1' } }`

---

## Implementation Order

1. **Install `@feathersjs/schema`** - Add dependency
2. **Create `src/validators.js`** - Set up AJV with ObjectId keyword
3. **Create `src/resolvers/index.js`** - Shared resolver utilities
4. **Create resolvers for each service** - 11 resolver files
5. **Update hooks for each service** - Add resolver hooks
6. **Test thoroughly** - Verify ObjectIds are stored correctly

---

## Estimated Implementation Effort

| Phase | Effort |
|-------|--------|
| Core setup (validators, utilities) | ~30 min |
| Create 11 resolver files | ~2-3 hours |
| Update 11 hook files | ~1-2 hours |
| Testing | ~1-2 hours |
| **Total** | **~4-7 hours** |

---

## Testing Checklist

- [ ] Create operations store ObjectId types (not strings)
- [ ] Update/Patch operations store ObjectId types
- [ ] Find queries with string IDs work correctly
- [ ] Find queries with `$in`, `$nin`, `$ne` operators work
- [ ] Nested fields (steps[].form) are converted
- [ ] Array fields (investigators, supporters) are converted
- [ ] Permissions nested objects are converted
- [ ] All existing tests pass

---

## Rollback Plan

If issues arise after implementation:

1. **Remove resolver hooks** from all service hooks files
2. **Keep resolver files** (no harm if not used)

The application will continue to work with string IDs (just not ideal for MongoDB indexing and queries).

---

## References

- [Feathers v5 MongoDB Adapter - ObjectIds](https://feathersjs.com/api/databases/mongodb#objectids)
- [Feathers v5 Resolvers](https://feathersjs.com/api/schema/resolvers)
- [Feathers v5 Validators](https://feathersjs.com/api/schema/validators)
- [resolveObjectId source](https://github.com/feathersjs/feathers/blob/dove/packages/mongodb/src/index.ts)
