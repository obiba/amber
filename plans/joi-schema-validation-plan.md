# Joi Schema Validation Plan

## Overview

Convert orphaned Mongoose models (`src/models/`) to Joi schemas that enforce full data validation at the API level, then delete the unused Mongoose files.

### Goals

- Full validation of all fields (types, required, min/max, patterns, enums)
- Keep Joi (already partially in use in user service)
- Exclude hook-set fields (createdBy, study) from user-input validation
- Strict enum validation for state fields
- Separate create vs patch schemas (explicit required vs optional)

---

## Current State

### Validation Status by Service

| Service | Has Joi Validation | Has Mongoose Model |
|---------|-------------------|-------------------|
| user | Yes (3 schemas) | Yes |
| study | No | Yes |
| form | No | Yes |
| form-revision | No | Yes |
| group | No | Yes |
| audit | No | Yes |
| task | No | Yes |
| campaign | No | Yes |
| participant | No | Yes |
| interview | No | Yes |
| interview-design | No | Yes |
| case-report | No | Yes |
| case-report-form | No | Yes |

---

## File Structure

### New Files to Create

```
src/schemas/
├── index.js                      # Export all schemas
├── common.js                     # Shared Joi patterns (objectId, enums)
├── audit.schema.js
├── campaign.schema.js
├── case-report.schema.js
├── case-report-form.schema.js
├── form.schema.js
├── form-revision.schema.js
├── group.schema.js
├── interview.schema.js
├── interview-design.schema.js
├── participant.schema.js
├── study.schema.js
├── task.schema.js
└── user.schema.js                # Move from user.hooks.js
```

### Files to Delete

```
src/mongoose.js                   # Unused Mongoose connection
src/models/                       # Entire directory (13 model files)
```

---

## Implementation Order

### Phase 1: Setup
1. Create `src/schemas/` directory
2. Create `src/schemas/common.js` with shared patterns
3. Create `src/schemas/index.js` exports file

### Phase 2: Simple Schemas
4. Create study, group, audit, task schemas
5. Update hooks for these services

### Phase 3: Medium Schemas
6. Create form, form-revision, campaign, case-report, case-report-form schemas
7. Update hooks for these services

### Phase 4: Complex Schemas
8. Create participant, interview, interview-design schemas
9. Update hooks for these services

### Phase 5: User Schema Refactor
10. Create `user.schema.js` (move from user.hooks.js)
11. Update user.hooks.js to import from schema file

### Phase 6: Cleanup
12. Delete `src/mongoose.js`
13. Delete `src/models/` directory

### Phase 7: Testing
14. Run full test suite and fix issues

---

## Summary

| Category | Count |
|----------|-------|
| New schema files | 15 |
| Hooks files to update | 13 |
| Files to delete | 14 |
| **Total effort** | **~8-12 hours** |

---

## Hooks Integration Pattern

```javascript
// Validation order in hooks:
create: [
  validate.mongoose(createSchema, joiOptions),  // 1. Joi validation
  schemaHooks.resolveData(dataResolver),        // 2. ObjectId conversion  
  someCreateHook(),                              // 3. Business logic
  authorize({ adapter: '@feathersjs/mongodb' }) // 4. Authorization
]
```

---

## Rollback Plan

If issues arise:
1. Schema files can be removed without affecting functionality
2. Remove `validate.mongoose()` calls from hooks
3. The application will continue to work without validation
